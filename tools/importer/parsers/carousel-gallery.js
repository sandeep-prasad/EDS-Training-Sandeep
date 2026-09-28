/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-gallery. Base: carousel.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *
 * Source: <div class="carousel cmp-carousel--mini"> with
 * <div class="cmp-carousel__item"> slides, each holding a single image.
 *
 * Library convention (base: carousel): 2-column table. First row = block name;
 * each subsequent row = one slide with [image, optional text]. These slides are
 * image-only, so the second (text) cell is left empty.
 */
export default function parse(element, { document }) {
  const slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  const cells = [];

  slides.forEach((slide) => {
    const image = slide.querySelector('.cmp-image__image, img');
    if (!image) return;
    cells.push([image, '']);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-gallery', cells });
  element.replaceWith(block);
}
