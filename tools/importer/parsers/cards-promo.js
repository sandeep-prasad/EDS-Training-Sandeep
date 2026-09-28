/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-promo. Base: cards.
 * Source: https://wknd.site/us/en/magazine.html
 * Generated: 2026-09-14
 *
 * The "Members Only" promo is a set of sibling `.cmp-teaser--secure` teasers
 * with no common wrapper. The import framework invokes this parser once per
 * matched element, so the FIRST invocation collects every sibling secure
 * teaser, builds a single multi-row block, and removes the trailing siblings.
 * Subsequent invocations are skipped by the framework's `!parentNode` guard.
 *
 * Library convention (base: cards): 2-column table. First row = block name.
 * Each subsequent row = one promo item: [image cell, body cell]. Body cell =
 * heading + description + "Read More" CTA. The block's decorate() detects the
 * image cell by content (picture present), so the body still renders above the
 * image regardless of authored cell order.
 */
export default function parse(element, { document }) {
  // Collect this teaser plus any following sibling secure teasers so the whole
  // promo group becomes one block. Only gather siblings sharing the secure class.
  const group = [element];
  let sib = element.nextElementSibling;
  while (sib) {
    if (sib.matches && sib.matches('.teaser.cmp-teaser--secure')) group.push(sib);
    sib = sib.nextElementSibling;
  }

  const cells = [];

  group.forEach((teaser) => {
    const image = teaser.querySelector('.cmp-teaser__image img, .cmp-image__image, img');
    const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = teaser.querySelector('.cmp-teaser__description, p');
    const actionText = teaser.querySelector('.cmp-teaser__action-container');
    const actionLink = teaser.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a');

    // Skip empty teasers.
    if (!image && !title && !description) return;

    const bodyCell = [];

    if (title) {
      const heading = document.createElement('h3');
      heading.textContent = title.textContent.trim();
      bodyCell.push(heading);
    }

    if (description) bodyCell.push(description);

    // Preserve the CTA. The source "Read More" has no href, so emit plain text
    // when no link is present rather than fabricating a destination.
    if (actionLink && actionLink.getAttribute('href')) {
      bodyCell.push(actionLink);
    } else if (actionText) {
      const p = document.createElement('p');
      p.textContent = actionText.textContent.trim();
      bodyCell.push(p);
    }

    cells.push([image || '', bodyCell]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo', cells });
  element.replaceWith(block);

  // Remove the trailing sibling teasers now folded into the block above.
  group.slice(1).forEach((teaser) => teaser.remove());
}
