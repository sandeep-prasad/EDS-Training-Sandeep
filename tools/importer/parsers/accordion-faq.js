/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://wknd.site/us/en/faqs.html
 *
 * Library convention (base: accordion): 2-column table. First row = block name;
 * each subsequent row = one accordion item: [title, content].
 *
 * Source: <div class="accordion"> with <div class="cmp-accordion__item"> rows,
 * each holding a <span class="cmp-accordion__title"> question and a
 * <div class="cmp-accordion__panel"> answer (rich text).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));
  const cells = [];

  items.forEach((item) => {
    const title = item.querySelector('.cmp-accordion__title, .cmp-accordion__header, h3, h4');
    const panel = item.querySelector('.cmp-accordion__panel');
    const question = title ? title.textContent.trim() : '';
    if (!question) return;

    // Prefer the panel's meaningful content nodes; fall back to the panel itself.
    let answer = '';
    if (panel) {
      const inner = panel.querySelector('.cmp-text, .cmp-container') || panel;
      answer = [...inner.childNodes];
    }

    cells.push([question, answer]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
