import { createOptimizedPicture } from '../../scripts/aem.js';

/*
 * cards-article — borderless article/adventure card grid (image on top, title +
 * short description below).
 *
 * Two modes:
 *  - Static (default): cards come from authored rows.
 *  - Dynamic: when the block carries the `dynamic` variant class, cards are
 *    built from the query index (/query-index.json), newest-first, so newly
 *    published content appears automatically as the first card. The block's
 *    config rows set the source and count:
 *        | source | /us/en/magazine/ |
 *        | limit  | 4                |
 *    `source` is a path prefix (only direct children are listed); `limit` caps
 *    the card count (default 4). The index is unavailable at author time, so a
 *    dynamic block with no index simply renders empty.
 */

/** Build one card <li> from image + linked title + description. */
function buildCard(document, {
  path, title, description, image,
}) {
  const li = document.createElement('li');

  const imgDiv = document.createElement('div');
  imgDiv.className = 'cards-article-card-image';
  if (image) {
    const optimized = createOptimizedPicture(image, title || '', false, [{ width: '750' }]);
    imgDiv.append(optimized);
  }

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'cards-article-card-body';
  const h3 = document.createElement('h3');
  const a = document.createElement('a');
  a.href = path;
  a.textContent = title || path;
  h3.append(a);
  bodyDiv.append(h3);
  if (description) {
    const p = document.createElement('p');
    p.textContent = description;
    bodyDiv.append(p);
  }

  li.append(imgDiv, bodyDiv);
  return li;
}

/** Read simple key/value config rows (2-cell rows) into an object, then clear them. */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  });
  return config;
}

async function decorateDynamic(block) {
  const config = readConfig(block);
  const source = config.source || '/us/en/';
  const limit = Number.parseInt(config.limit, 10) || 4;
  const root = source.replace(/\/$/, '');
  const rootDepth = root.split('/').filter(Boolean).length;

  const ul = document.createElement('ul');
  block.textContent = '';
  block.append(ul);

  let data;
  try {
    const resp = await fetch('/query-index.json');
    if (!resp.ok) return;
    ({ data } = await resp.json());
  } catch (e) {
    return;
  }
  if (!Array.isArray(data)) return;

  const items = data
    // direct children of the source prefix (exclude the section landing page itself)
    .filter((row) => {
      const path = (row.path || '').replace(/\/$/, '');
      if (!path.startsWith(`${root}/`)) return false;
      return path.split('/').filter(Boolean).length === rootDepth + 1;
    })
    .filter((row) => !/noindex/i.test(row.robots || ''))
    // newest first (numeric lastModified seconds); missing dates sort last
    .sort((a, b) => (Number(b.lastModified) || 0) - (Number(a.lastModified) || 0))
    .slice(0, limit);

  items.forEach((row) => ul.append(buildCard(document, row)));
}

function decorateStatic(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-article-card-image';
      else div.className = 'cards-article-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}

export default async function decorate(block) {
  if (block.classList.contains('dynamic')) {
    await decorateDynamic(block);
  } else {
    decorateStatic(block);
  }
}
