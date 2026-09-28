/*
 * columns-details — activity/spec key-value panel.
 * Base: columns. Renders a definition list of label/value pairs, with an
 * optional leading title row.
 *
 * Content model (EDS table, 2 columns throughout): first row = block name.
 *   - A row whose SECOND cell is empty = panel title (first cell = title text).
 *   - Any other row = one spec: [label, value].
 * Rows with both cells empty are skipped.
 */
export default function decorate(block) {
  let title = null;
  const dl = document.createElement('dl');
  dl.className = 'columns-details-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const label = cells[0] ? cells[0].textContent.trim() : '';
    const value = cells[1] ? cells[1].textContent.trim() : '';

    if (!label && !value) return;

    // Title row: content in the first cell, empty second cell.
    if (label && !value && cells.length <= 2) {
      title = label;
      return;
    }

    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.append(dt, dd);
  });

  block.textContent = '';
  if (title) {
    const heading = document.createElement('h3');
    heading.className = 'columns-details-title';
    heading.textContent = title;
    block.append(heading);
  }
  block.append(dl);
}
