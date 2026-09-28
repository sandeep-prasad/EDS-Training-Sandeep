// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

// Nav section root: the primary nav is built from the query index, showing the
// direct children of this path (e.g. /us/en/magazine, /us/en/adventures). Any
// newly published section page under it appears automatically.
const NAV_ROOT = '/us/en';

// Curated ordering for known WKND sections; anything not listed sorts after,
// alphabetically. A page's `nav-order` metadata (numeric) overrides this.
const NAV_ORDER = ['magazine', 'adventures', 'faqs', 'about-us'];

/**
 * Build the primary nav list from the query index. Returns a <ul> of links to
 * the direct child sections of NAV_ROOT, or null when the index is unavailable
 * (callers fall back to the nav fragment's own list).
 */
async function buildNavListFromIndex() {
  let resp;
  try {
    resp = await fetch('/query-index.json');
  } catch (e) {
    return null;
  }
  if (!resp || !resp.ok) return null;
  const { data } = await resp.json();
  if (!Array.isArray(data)) return null;

  const rootDepth = NAV_ROOT.split('/').filter(Boolean).length;
  const sections = data
    // direct children of NAV_ROOT only (exactly one path segment deeper)
    .filter((row) => {
      const path = (row.path || '').replace(/\/$/, '');
      if (!path.startsWith(`${NAV_ROOT}/`)) return false;
      return path.split('/').filter(Boolean).length === rootDepth + 1;
    })
    // respect robots noindex (BYOM indexes everything; filter client-side)
    .filter((row) => !/noindex/i.test(row.robots || ''))
    .map((row) => {
      const path = row.path.replace(/\/$/, '');
      const slug = path.split('/').pop();
      const label = (row.navtitle || row.title || slug).trim();
      const order = Number.parseInt(row.navorder, 10);
      return {
        path, slug, label, order,
      };
    });

  if (!sections.length) return null;

  sections.sort((a, b) => {
    // explicit numeric nav-order wins
    const ao = Number.isNaN(a.order) ? Infinity : a.order;
    const bo = Number.isNaN(b.order) ? Infinity : b.order;
    if (ao !== bo) return ao - bo;
    // then curated order for known sections
    const ai = NAV_ORDER.indexOf(a.slug);
    const bi = NAV_ORDER.indexOf(b.slug);
    const ar = ai === -1 ? Infinity : ai;
    const br = bi === -1 ? Infinity : bi;
    if (ar !== br) return ar - br;
    // finally alphabetical by label
    return a.label.localeCompare(b.label);
  });

  const ul = document.createElement('ul');
  sections.forEach((section) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = section.path;
    a.textContent = section.label;
    li.append(a);
    ul.append(li);
  });
  return ul;
}

/**
 * Fetch the nav fragment. Metadata-independent dual-fetch:
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
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

/** Build the locale dropdown from the country list (a <ul> of countries). */
function decorateLocale(list) {
  if (!list) return null;

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-locale';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'nav-locale-toggle';
  toggle.setAttribute('aria-expanded', 'false');

  // Current-locale label shows ONLY the locale code (e.g. "en-US"), matching the
  // source toggle; the country name is used for the accessible label only.
  const firstItem = list.querySelector(':scope > li');
  const firstFlag = firstItem?.querySelector('img');
  const firstLocale = firstItem?.querySelector('ul a');
  // Country name = the item's text with the nested locale-code list removed
  // (handles both "<li>Country<ul>…" and "<li><p><img> Country</p><ul>…").
  let countryName = '';
  if (firstItem) {
    const clone = firstItem.cloneNode(true);
    clone.querySelectorAll('ul').forEach((u) => u.remove());
    countryName = clone.textContent.replace(/\s+/g, ' ').trim();
  }
  const localeCode = firstLocale ? firstLocale.textContent.trim() : 'en-US';
  if (firstFlag) toggle.append(firstFlag.cloneNode(true));
  const label = document.createElement('span');
  label.className = 'nav-locale-code';
  label.textContent = localeCode;
  toggle.append(label);
  toggle.setAttribute('aria-label', `Toggle language ${[countryName, localeCode].filter(Boolean).join(' ')}`.trim());

  const panel = document.createElement('div');
  panel.className = 'nav-locale-panel';
  panel.append(list.cloneNode(true));

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    wrapper.classList.toggle('is-open', !open);
  });

  wrapper.append(toggle, panel);
  return wrapper;
}

/** Build the search form. Controls are created here, never in the fragment. */
function decorateSearch() {
  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = '/us/en/search.html';
  form.method = 'get';

  const icon = document.createElement('span');
  icon.className = 'nav-search-icon';
  icon.setAttribute('aria-hidden', 'true');

  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.placeholder = 'Search';
  input.setAttribute('aria-label', 'Search');

  form.append(icon, input);
  return form;
}

/**
 * loads and decorates the header nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const [fragment, indexNavList] = await Promise.all([
    fetchNavFragment(),
    buildNavListFromIndex(),
  ]);
  block.textContent = '';
  if (!fragment) return;
  fixImagePaths(fragment);

  // Content-driven: DA/EDS may collapse the source's two section <div>s into a
  // single flat sequence of <p>/<ul>, so locate each piece by what it IS rather
  // than by section index.
  const scope = fragment.querySelector('main') || fragment.querySelector('body') || fragment;
  const lists = [...scope.querySelectorAll('ul')];
  // Locale list = the <ul> with flag images and/or nested country sub-lists.
  const localeList = lists.find((ul) => ul.querySelector('img') || ul.querySelector('ul')) || null;
  // Primary nav list: prefer the index-built list (auto-includes new pages);
  // fall back to a top-level <ul> from the fragment that isn't the locale list.
  const fragmentNavList = lists.find((ul) => ul !== localeList && !ul.closest('li')) || null;
  const navList = indexNavList || fragmentNavList;
  // Sign In = link pointing at the sign-in anchor (fallback: first imageless link).
  const signIn = scope.querySelector('a[href*="sign-in" i]')
    || [...scope.querySelectorAll('p a')].find((a) => !a.querySelector('img') && !a.closest('ul'));
  // Logo = the <p> link that wraps an image/picture.
  const logoLink = [...scope.querySelectorAll('p a')].find((a) => a.querySelector('img, picture'));

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // --- Utility bar: sign-in + locale ---
  if (signIn || localeList) {
    const utility = document.createElement('div');
    utility.className = 'nav-utility';
    const inner = document.createElement('div');
    inner.className = 'nav-utility-inner';

    if (signIn) {
      const link = signIn.cloneNode(true);
      link.classList.add('nav-signin');
      inner.append(link);
    }

    if (localeList) {
      const locale = decorateLocale(localeList);
      if (locale) inner.append(locale);
    }

    utility.append(inner);
    nav.append(utility);
  }

  // --- Main header: logo + nav links + search ---
  {
    const main = document.createElement('div');
    main.className = 'nav-main';
    const inner = document.createElement('div');
    inner.className = 'nav-main-inner';

    if (logoLink) {
      const brand = document.createElement('div');
      brand.className = 'nav-brand';
      brand.append(logoLink.cloneNode(true));
      inner.append(brand);
    }

    // hamburger toggle (mobile)
    const hamburger = document.createElement('button');
    hamburger.type = 'button';
    hamburger.className = 'nav-hamburger';
    hamburger.setAttribute('aria-label', 'Open navigation');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';

    // primary nav links + search
    const sectionsWrap = document.createElement('div');
    sectionsWrap.className = 'nav-sections';
    if (navList) sectionsWrap.append(navList.cloneNode(true));
    sectionsWrap.append(decorateSearch());

    hamburger.addEventListener('click', () => {
      const open = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!open));
      hamburger.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('is-open', !open);
    });

    inner.append(hamburger, sectionsWrap);
    main.append(inner);
    nav.append(main);
  }

  // Reset transient state when crossing the desktop/mobile breakpoint.
  isDesktop.addEventListener('change', () => {
    nav.classList.remove('is-open');
    const hb = nav.querySelector('.nav-hamburger');
    if (hb) {
      hb.setAttribute('aria-expanded', 'false');
      hb.setAttribute('aria-label', 'Open navigation');
    }
    nav.querySelectorAll('.nav-locale').forEach((l) => l.classList.remove('is-open'));
    nav.querySelectorAll('.nav-locale-toggle').forEach((t) => t.setAttribute('aria-expanded', 'false'));
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
