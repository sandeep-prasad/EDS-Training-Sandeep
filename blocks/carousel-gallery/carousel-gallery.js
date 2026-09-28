import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * carousel-gallery — image-only slide gallery with prev/next controls and dot
 * indicators. Base: carousel. Unlike carousel-hero, slides carry no overlay
 * text — each slide is a single photograph.
 *
 * Content model (EDS table, base: carousel): first row = block name; each
 * subsequent row = one slide. Cell 1 = image (mandatory); cell 2 = optional
 * text content. These slides are image-only, so cell 2 is typically empty.
 */
let galleryInstance = 0;

export default function decorate(block) {
  galleryInstance += 1;
  const id = galleryInstance;

  const slides = [...block.children];
  const track = document.createElement('div');
  track.className = 'carousel-gallery-track';

  slides.forEach((row, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-gallery-slide';
    slide.id = `carousel-gallery-${id}-slide-${i}`;
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    if (i !== 0) slide.setAttribute('aria-hidden', 'true');
    // Move the image (and any optional text cell) into the slide; drop cells
    // that carry no meaningful content (e.g. an empty second column).
    [...row.children].forEach((cell) => {
      if (cell.textContent.trim() || cell.querySelector('picture, img')) {
        while (cell.firstChild) slide.append(cell.firstChild);
      }
    });
    track.append(slide);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '1600' }]);
    img.closest('picture').replaceWith(optimized);
  });

  block.textContent = '';
  block.append(track);

  const slideEls = [...track.children];
  if (slideEls.length <= 1) return; // no controls needed for a single image

  // Dot indicators — built first so show() can reference them.
  const dotList = document.createElement('div');
  dotList.className = 'carousel-gallery-dots';
  dotList.setAttribute('role', 'tablist');

  let current = 0;
  const show = (index) => {
    current = (index + slideEls.length) % slideEls.length;
    slideEls.forEach((s, i) => {
      if (i === current) s.removeAttribute('aria-hidden');
      else s.setAttribute('aria-hidden', 'true');
    });
    track.style.transform = `translateX(-${current * 100}%)`;
    // dots is defined just below; show() is only invoked after that. (closure)
    // eslint-disable-next-line no-use-before-define
    dots.forEach((d, i) => d.setAttribute('aria-selected', i === current ? 'true' : 'false'));
  };

  const dots = slideEls.map((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'carousel-gallery-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => show(i));
    dotList.append(dot);
    return dot;
  });

  // Prev/next controls
  const nav = document.createElement('div');
  nav.className = 'carousel-gallery-nav';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-gallery-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.addEventListener('click', () => show(current - 1));
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-gallery-next';
  next.setAttribute('aria-label', 'Next slide');
  next.addEventListener('click', () => show(current + 1));
  nav.append(prev, next);

  block.append(nav, dotList);
  show(0);
}
