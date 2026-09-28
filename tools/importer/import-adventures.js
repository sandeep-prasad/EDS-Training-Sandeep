/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsArticleParser from './parsers/cards-article.js';
import tabsFilterParser from './parsers/tabs-filter.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-article': cardsArticleParser,
  'tabs-filter': tabsFilterParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adventures',
  description: 'WKND Adventures listing page: hero teaser + interactive category-filter (tabs) whose panels hold adventure card grids.',
  urls: [
    'https://wknd.site/us/en/adventures.html',
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['.teaser.cmp-teaser--hero'],
    },
    {
      name: 'cards-article',
      instances: ['.image-list.list'],
    },
    {
      name: 'tabs-filter',
      instances: ['.tabs.panelcontainer'],
    },
  ],
  sections: [
    {
      id: 'section-1-page-title',
      name: 'page-title',
      selector: ['.title:not(.cmp-title--underline)'],
      style: null,
      blocks: [],
      defaultContent: ['.title .cmp-title__text'],
    },
    {
      id: 'section-2-hero-teaser',
      name: 'hero-teaser',
      selector: ['.teaser.cmp-teaser--hero'],
      style: null,
      blocks: ['hero-banner'],
      defaultContent: [],
    },
    {
      id: 'section-3-current-adventures-title',
      name: 'current-adventures-title',
      selector: ['.title.cmp-title--underline'],
      style: null,
      blocks: [],
      defaultContent: ['.title.cmp-title--underline .cmp-title__text'],
    },
    {
      id: 'section-4-adventures-browser',
      name: 'adventures-browser',
      selector: ['.tabs.panelcontainer'],
      style: null,
      blocks: ['tabs-filter', 'cards-article'],
      defaultContent: [],
    },
    {
      id: 'section-5-trailing-separator',
      name: 'trailing-separator',
      selector: ['.separator'],
      style: null,
      blocks: [],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - Section transformer runs after cleanup (afterTransform hook)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element) => {
        // avoid double-processing the same element matched by multiple selectors
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block. The tabs-filter parser consumes the card grids inside
    //    its panels (emitting them as nested cards-article blocks), so process
    //    tabs-filter BEFORE the standalone cards-article instances — once a grid
    //    is folded into the tabs block and detached, the later cards-article pass
    //    skips it via the parentNode guard.
    const order = { 'tabs-filter': 0 };
    pageBlocks.sort((a, b) => (order[a.name] ?? 1) - (order[b.name] ?? 1));

    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by earlier parser
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path (map root URL to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
