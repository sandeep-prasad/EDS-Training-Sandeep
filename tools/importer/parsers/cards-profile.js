/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-profile. Base: cards.
 * Source: https://wknd.site/us/en/about-us.html
 *
 * Library convention (base: cards): 2-column table. First row = block name;
 * each subsequent row = one card: [image, body]. Body = name + role + social.
 *
 * Each contributor is a <section class="cmp-experience-fragment--contributor">
 * with a portrait image, an <h3> name, an <h5> role, and a row of social links.
 * The page has TWO grids (Our Contributors, WKND Guides) as sibling sections
 * separated by a heading. The framework invokes this parser once per matched
 * section, so the FIRST invocation of each contiguous run collects the run into
 * one block and removes the rest; invocations for already-consumed sections are
 * skipped via the framework's !parentNode guard.
 */
export default function parse(element, { document }) {
  const isContributor = (el) => el
    && el.matches
    && el.matches('.experiencefragment.cmp-experience-fragment--contributor');

  // If the previous sibling is also a contributor, this section belongs to an
  // earlier run and will be consumed by that run's first invocation — skip.
  if (isContributor(element.previousElementSibling)) {
    return;
  }

  const group = [element];
  let sib = element.nextElementSibling;
  while (isContributor(sib)) {
    group.push(sib);
    sib = sib.nextElementSibling;
  }

  const cells = [];
  group.forEach((section) => {
    const image = section.querySelector('.cmp-image__image, img');
    const name = section.querySelector('h3, .cmp-title__text');
    // Role is an <h5> (all cards); .cmp-title--black only wraps the first card's.
    const role = section.querySelector('h5, .cmp-title--black .cmp-title__text');
    // Social links: match by href pattern OR by link text (some cards use a
    // generic href like "#jacob-wester" but keep Facebook/Twitter/Instagram text).
    const socialLinks = [...section.querySelectorAll('a[href]')]
      .filter((a) => /facebook|twitter|insta/i.test(`${a.getAttribute('href') || ''} ${a.textContent || ''}`));

    if (!image && !name) return;

    const body = [];
    if (name) {
      const h = document.createElement('h3');
      h.textContent = name.textContent.trim();
      body.push(h);
    }
    if (role) {
      const h = document.createElement('h5');
      h.textContent = role.textContent.trim();
      body.push(h);
    }
    if (socialLinks.length) {
      const p = document.createElement('p');
      socialLinks.forEach((a) => {
        const link = document.createElement('a');
        link.setAttribute('href', a.getAttribute('href'));
        link.textContent = a.textContent.trim() || a.getAttribute('href');
        p.append(link, document.createTextNode(' '));
      });
      body.push(p);
    }

    cells.push([image || '', body]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-profile', cells });
  element.replaceWith(block);

  // Remove the trailing sections now folded into the block.
  group.slice(1).forEach((section) => section.remove());
}
