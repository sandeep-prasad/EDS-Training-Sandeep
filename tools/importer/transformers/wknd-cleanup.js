/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome (header experience fragment, footer
 * experience fragment, mobile nav, ID-syncing iframe) and stray markup.
 * All selectors verified against migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Mobile nav toggle + overlay and the Adobe ID-syncing iframe are site
    // chrome / tracking, not authorable content. Removing before parsing keeps
    // them out of any block matching.
    // Verified in cleaned.html: #toggleNav (l.568), #mobileNav (l.574),
    // iframe#destination_publishing_iframe_wkndsite_0 (l.566).
    WebImporter.DOMUtils.remove(element, [
      '#toggleNav',
      '#mobileNav',
      '#destination_publishing_iframe_wkndsite_0',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome. Verified in cleaned.html:
    // header experience fragment (l.5) — sign-in, language nav, main nav, search.
    // footer experience fragment (l.471) — footer nav, follow-us, copyright.
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment',
      '.cmp-experiencefragment--header',
      'footer.experiencefragment',
      '.cmp-experiencefragment--footer',
      'iframe',
      'noscript',
    ]);

    // Stray empty <meta> tags left inside cmp-image blocks (l.183, 204, 227,
    // 271, 334, 378) are not authorable; remove them.
    element.querySelectorAll('meta').forEach((el) => el.remove());
  }
}
