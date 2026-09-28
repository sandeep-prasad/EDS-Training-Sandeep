/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://wknd.site/us/en.html
 * Generated: 2026-09-12
 *
 * Library convention: columns table. First row = block name.
 * This featured promo is a single row with two columns:
 *   [image cell, content cell]. Content cell = eyebrow + heading + description + CTA.
 */
export default function parse(element, { document }) {
  const image = element.querySelector('.cmp-teaser__image img, .cmp-image__image, img');
  const pretitle = element.querySelector('.cmp-teaser__pretitle');
  const title = element.querySelector('.cmp-teaser__title, h1, h2, h3');
  // Exclude pretitle from the description fallback so a bare <p> pretitle
  // isn't mistaken for the description (selectors must be mutually exclusive).
  const description = element.querySelector('.cmp-teaser__description, p:not(.cmp-teaser__pretitle)');
  const cta = element.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

  // Empty-block guard.
  if (!image && !title && !description) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const contentCell = [];
  if (pretitle) contentCell.push(pretitle);
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);

  const cells = [
    [image || '', contentCell],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
