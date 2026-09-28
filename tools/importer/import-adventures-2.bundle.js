/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-adventures-2.js
  var import_adventures_2_exports = {};
  __export(import_adventures_2_exports, {
    default: () => import_adventures_2_default
  });

  // tools/importer/parsers/carousel-gallery.js
  function parse(element, { document: document2 }) {
    const slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    const cells = [];
    slides.forEach((slide) => {
      const image = slide.querySelector(".cmp-image__image, img");
      if (!image) return;
      cells.push([image, ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-gallery", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-details.js
  function parse2(element, { document: document2 }) {
    const cells = [];
    const title = element.querySelector(".cmp-contentfragment__title, h1, h2, h3");
    if (title && title.textContent.trim()) {
      cells.push([title.textContent.trim(), ""]);
    }
    const specs = element.querySelectorAll(".cmp-contentfragment__element");
    specs.forEach((spec) => {
      const label = spec.querySelector(".cmp-contentfragment__element-title, dt");
      const value = spec.querySelector(".cmp-contentfragment__element-value, dd");
      const labelText = label ? label.textContent.trim() : "";
      const valueText = value ? value.textContent.trim() : "";
      if (!labelText && !valueText) return;
      cells.push([labelText, valueText]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-details", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-content.js
  function parse3(element, { document: document2 }) {
    const tabs = Array.from(element.querySelectorAll(".cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    if (!tabs.length || !panels.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    tabs.forEach((tab, i) => {
      const label = tab.textContent.trim();
      if (!label) return;
      const panel = panels[i];
      const content = panel ? [...panel.childNodes] : "";
      cells.push([label, content]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-content", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#toggleNav",
        "#mobileNav",
        "#destination_publishing_iframe_wkndsite_0"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.experiencefragment",
        ".cmp-experiencefragment--header",
        "footer.experiencefragment",
        ".cmp-experiencefragment--footer",
        "iframe",
        "noscript"
      ]);
      element.querySelectorAll("meta").forEach((el) => el.remove());
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    for (const sel of selectors) {
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-adventures-2.js
  var parsers = {
    "carousel-gallery": parse,
    "columns-details": parse2,
    "tabs-content": parse3
  };
  var PAGE_TEMPLATE = {
    name: "adventures-2",
    description: "WKND adventure detail page: image gallery, activity spec panel, and a tabbed content switcher (Overview/Itinerary/What to Bring).",
    blocks: [
      {
        name: "carousel-gallery",
        instances: [".carousel.panelcontainer.cmp-carousel--mini"]
      },
      {
        name: "columns-details",
        instances: [".contentfragment.cmp-contentfragment--elements"]
      },
      {
        name: "tabs-content",
        instances: [".tabs.panelcontainer"]
      }
    ],
    sections: [
      {
        id: "section-1-breadcrumb",
        name: "breadcrumb",
        selector: [".breadcrumb.cmp-breadcrumb--fixed"],
        style: null,
        blocks: [],
        defaultContent: []
      },
      {
        id: "section-2-hero-carousel",
        name: "hero-carousel",
        selector: [".carousel.panelcontainer.cmp-carousel--mini"],
        style: null,
        blocks: ["carousel-gallery"],
        defaultContent: []
      },
      {
        id: "section-3-page-title",
        name: "page-title",
        selector: [".title.cmp-title--underline"],
        style: null,
        blocks: [],
        defaultContent: [".title.cmp-title--underline .cmp-title__text"]
      },
      {
        id: "section-4-activity-details",
        name: "activity-details",
        selector: [".contentfragment.cmp-contentfragment--elements"],
        style: null,
        blocks: ["columns-details"],
        defaultContent: []
      },
      {
        id: "section-5-detail-tabs",
        name: "detail-tabs",
        selector: [".tabs.panelcontainer"],
        style: null,
        blocks: ["tabs-content"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_adventures_2_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_adventures_2_exports);
})();
