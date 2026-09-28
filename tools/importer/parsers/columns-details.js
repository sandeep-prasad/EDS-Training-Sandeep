/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-details. Base: columns.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Generated: 2026-09-15
 *
 * Source: <article class="cmp-contentfragment"> with an optional
 * <h3 class="cmp-contentfragment__title"> and a
 * <dl class="cmp-contentfragment__elements"> of
 * <div class="cmp-contentfragment__element"><dt>label</dt><dd>value</dd></div>.
 *
 * Library convention (base: columns): every content row has the SAME column
 * count. This block is 2 columns throughout:
 *   - title row: [title, '']  (second cell empty)
 *   - spec rows: [label, value]
 */
export default function parse(element, { document }) {
  const cells = [];

  const title = element.querySelector('.cmp-contentfragment__title, h1, h2, h3');
  if (title && title.textContent.trim()) {
    cells.push([title.textContent.trim(), '']);
  }

  const specs = element.querySelectorAll('.cmp-contentfragment__element');
  specs.forEach((spec) => {
    const label = spec.querySelector('.cmp-contentfragment__element-title, dt');
    const value = spec.querySelector('.cmp-contentfragment__element-value, dd');
    const labelText = label ? label.textContent.trim() : '';
    const valueText = value ? value.textContent.trim() : '';
    if (!labelText && !valueText) return;
    cells.push([labelText, valueText]);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-details', cells });
  element.replaceWith(block);
}
