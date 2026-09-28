/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://wknd.site/us/en.html
 * Generated: 2026-09-12
 *
 * Library convention: 2-column table. First row = block name.
 * Each subsequent row = one card: [image cell, content cell].
 * Content cell = title (heading, linked) + description.
 * Reused across "Recent Articles" and "Where do you want to go?" grids;
 * the parser runs once per matched .image-list.list element.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item, li'));

  const cells = [];

  items.forEach((item) => {
    const image = item.querySelector('.cmp-image-list__item-image img, .cmp-image__image, img');
    const titleLink = item.querySelector('.cmp-image-list__item-title-link, a[class*="title"]');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description, p');

    // Skip stray items with no meaningful content.
    if (!image && !titleText && !description) return;

    const contentCell = [];

    // Promote the card title to a heading. Preserve the link if present.
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

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
