import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-profile — contributor/team profile card grid. Base: cards.
 * Each card is a centered portrait on top, then a name, a role/occupation line,
 * and an optional row of social links (rendered as icon tiles).
 *
 * Content model (EDS table): one row per person, cells in order:
 *   [portrait image, body(name + role + social links)]
 * The image cell is detected by content (contains a picture).
 */
const SOCIAL_PLATFORMS = ['facebook', 'twitter', 'instagram'];

/** Identify a social platform from a link's text/href, or null. */
function socialPlatform(a) {
  const hay = `${a.textContent || ''} ${a.getAttribute('href') || ''}`.toLowerCase();
  return SOCIAL_PLATFORMS.find((name) => hay.includes(name)) || null;
}

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    const cells = [...row.children];

    // Image cell = the one containing a picture/img.
    const imageCell = cells.find((c) => c.querySelector('picture, img'));
    const textCells = cells.filter((c) => c !== imageCell);

    if (imageCell) {
      imageCell.className = 'cards-profile-card-image';
      li.append(imageCell);
    }

    const body = document.createElement('div');
    body.className = 'cards-profile-card-body';
    textCells.forEach((c) => {
      while (c.firstChild) body.append(c.firstChild);
    });

    // The social row is the paragraph whose only content is links. Tag it and
    // each link with its platform so CSS can render an icon tile.
    [...body.querySelectorAll('p')].forEach((p) => {
      const links = [...p.querySelectorAll('a')];
      if (links.length && links.length >= p.childElementCount && !p.textContent.replace(/\s+/g, '').replace(/facebook|twitter|instagram/gi, '')) {
        p.className = 'cards-profile-card-social';
        links.forEach((a) => {
          const platform = socialPlatform(a);
          if (platform) {
            a.classList.add('cards-profile-social-link', `cards-profile-social-${platform}`);
            a.setAttribute('aria-label', platform.charAt(0).toUpperCase() + platform.slice(1));
            // hide the text label; the icon is drawn via CSS mask
            a.textContent = '';
          }
        });
      }
    });

    li.append(body);
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimized);
  });

  block.textContent = '';
  block.append(ul);
}
