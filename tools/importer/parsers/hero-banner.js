/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://wknd.site/us/en.html
 * Generated: 2026-09-12
 *
 * Library convention: 1-column, 3 rows. First row = block name.
 * Row 2 (1 cell): background image.
 * Row 3 (1 cell): title (heading) + subheading + CTA.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image__image, img');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = element.querySelector('.cmp-teaser__description, p:not(.cmp-teaser__pretitle)');
  const cta = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

  // Empty-block guard.
  if (!image && !title && !description) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (optional). Pad with empty cell if missing so
  // every content row keeps a single column.
  cells.push([image || '']);

  // Row 3: text content — all elements in one cell (1-column block).
  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);
  cells.push([contentCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
