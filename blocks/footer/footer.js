/**
 * Fetch the footer fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/** Rewrite relative image sources so they resolve from the site root. */
function fixImagePaths(scope) {
  scope.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('http') && !src.startsWith('/')) {
      img.src = `/${src}`;
    }
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;
  fixImagePaths(fragment);

  // Content-driven: DA/EDS may collapse the source's three section <div>s into a
  // single flat sequence, so locate each piece by what it IS rather than by
  // section index.
  const scope = fragment.querySelector('main') || fragment.querySelector('body') || fragment;
  const lists = [...scope.querySelectorAll('ul')];
  // Social list = the <ul> whose links wrap images (social icons).
  const socialList = lists.find((ul) => ul.querySelector('a img, a picture')) || null;
  // Nav list = a link list that isn't the social list.
  const navList = lists.find((ul) => ul !== socialList) || null;
  // Logo = the <p> link that wraps an image/picture.
  const logoLink = [...scope.querySelectorAll('p a')].find((a) => a.querySelector('img, picture'));
  const heading = scope.querySelector('h1, h2, h3, h4, h5, h6');
  // Legal = paragraphs that are not the logo paragraph.
  const legalParas = [...scope.querySelectorAll('p')]
    .filter((p) => !p.querySelector('img, picture') && p.textContent.trim());

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  // --- Brand logo + footer nav ---
  if (logoLink || navList) {
    const brand = document.createElement('div');
    brand.className = 'footer-brand';
    if (logoLink) brand.append(logoLink.cloneNode(true));
    if (navList) {
      const navWrap = document.createElement('nav');
      navWrap.setAttribute('aria-label', 'Footer navigation');
      navWrap.className = 'footer-nav';
      navWrap.append(navList.cloneNode(true));
      brand.append(navWrap);
    }
    footer.append(brand);
  }

  // --- Follow Us + social icons ---
  if (heading || socialList) {
    const social = document.createElement('div');
    social.className = 'footer-social';
    if (heading) social.append(heading.cloneNode(true));
    if (socialList) {
      const iconList = socialList.cloneNode(true);
      iconList.classList.add('footer-social-list');
      social.append(iconList);
    }
    footer.append(social);
  }

  // --- Copyright + attribution ---
  if (legalParas.length) {
    const legal = document.createElement('div');
    legal.className = 'footer-legal';
    legalParas.forEach((p) => legal.append(p.cloneNode(true)));
    footer.append(legal);
  }

  block.append(footer);
}
