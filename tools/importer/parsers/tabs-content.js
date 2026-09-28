/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-content. Base: tabs.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 *
 * Library convention (base: tabs): 2-column table. First row = block name;
 * each subsequent row = one tab: [tab label, tab content].
 *
 * Source: <div class="tabs panelcontainer"> with an
 * <ol class="cmp-tabs__tablist"><li class="cmp-tabs__tab">Label</li>…</ol> and
 * one <div class="cmp-tabs__tabpanel"> per tab holding rich-text body content.
 * Panels are prose (no nested block) and are paired to tabs by index; missing
 * tabs/panels are guarded.
 */
export default function parse(element, { document }) {
  const tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  // Empty-block guard.
  if (!tabs.length || !panels.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  tabs.forEach((tab, i) => {
    const label = tab.textContent.trim();
    if (!label) return;
    const panel = panels[i];
    const content = panel ? [...panel.childNodes] : '';
    cells.push([label, content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-content', cells });
  element.replaceWith(block);
}
