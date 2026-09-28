/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-filter. Base: tabs.
 * Source: https://wknd.site/us/en/adventures.html
 * Generated: 2026-09-15
 *
 * Library convention (base: tabs): 2-column table. First row = block name.
 * Each subsequent row = one tab: [tab label cell, tab content cell].
 *
 * Source structure (.tabs.panelcontainer):
 *   <ol class="cmp-tabs__tablist"><li class="cmp-tabs__tab">Label</li>…</ol>
 *   followed by <div class="cmp-tabs__tabpanel">…</div> panels (one per tab),
 *   each containing a <div class="image-list list"> adventure card grid.
 *
 * The content cell holds a NESTED cards-article block (built with
 * WebImporter.Blocks.createBlock) so the grid decorates at runtime. Tabs and
 * panels are paired by index; missing tabs or panels are guarded.
 */

// Build the cell layout for a single cards-article block from an image-list.
// Mirrors tools/importer/parsers/cards-article.js: [image cell, content cell].
function buildCardsArticleBlock(document, list) {
  const items = Array.from(list.querySelectorAll('.cmp-image-list__item, li'));
  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image__image, img');
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title"]');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description, p');

    if (!image && !titleText && !description) return;

    const contentCell = [];
    if (titleText) {
      const heading = document.createElement('h3');
      const href = titleLink && titleLink.getAttribute('href');
      if (href) {
        const link = document.createElement('a');
        link.setAttribute('href', href);
        link.textContent = titleText.textContent.trim();
        heading.append(link);
      } else {
        heading.textContent = titleText.textContent.trim();
      }
      contentCell.push(heading);
    }
    if (description) contentCell.push(description);

    cells.push([image || '', contentCell]);
  });

  if (!cells.length) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
}

export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  // Empty-block guard.
  if (!tabs.length || !panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    if (!label) return;

    const panel = panels[i];
    let panelContent = '';
    if (panel) {
      const list = panel.querySelector('.image-list.list, .cmp-image-list');
      if (list) {
        panelContent = buildCardsArticleBlock(document, list) || '';
      } else {
        // Non-card panel content: keep whatever the panel holds.
        panelContent = [...panel.childNodes];
      }
    }

    cells.push([label, panelContent]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-filter', cells });
  element.replaceWith(block);
}
