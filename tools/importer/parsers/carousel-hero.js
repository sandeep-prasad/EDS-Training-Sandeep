/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/us/en.html
 * Generated: 2026-09-12
 *
 * Library convention: 2-column table. First row = block name.
 * Each subsequent row = one slide: [image cell, content cell].
 * Content cell holds title (heading) + description + CTA link.
 */
export default function parse(element, { document }) {
  // Each carousel item is one slide. Fallback to teaser wrappers for variation.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('.teaser.cmp-teaser--hero, .cmp-teaser'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image cell (mandatory): the slide's teaser image.
    const image = slide.querySelector('.cmp-teaser__image img, .cmp-image__image, img');

    // Content cell: title, description, CTA.
    const title = slide.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = slide.querySelector('.cmp-teaser__description, p');
    const cta = slide.querySelector('.cmp-teaser__action-link, .cmp-teaser__action-container a, a');

    // Skip empty slides (e.g. stray wrappers with no content).
    if (!image && !title && !description) return;

    const contentCell = [];
    if (title) contentCell.push(title);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);

    cells.push([image || '', contentCell]);
  });

  // Empty-block guard: no valid slides found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
