import { decorateBlock, loadBlock } from '../../scripts/aem.js';

/*
 * tabs-filter — category filter with one switchable content panel per tab.
 * Base: tabs (Block Collection). Adapted as a category filter for listing grids.
 *
 * Content model (EDS table): one row per tab.
 *   cell 1 = tab label (e.g. "All", "Climbing")
 *   cell 2 = that tab's panel content (typically a nested card grid block)
 *
 * decorate() builds an accessible tablist from the label cells, one tabpanel
 * per row from the content cells, wires click + keyboard handlers to switch the
 * active tab/panel, and shows the first tab by default. Authors omitting a label
 * or a panel cell are handled gracefully (fallback label, empty panel).
 *
 * Nested blocks: a panel may embed another block (e.g. a cards-article grid).
 * EDS's block pipeline only converts TOP-LEVEL tables to block divs and only
 * decorates `.section > div > div`, so a nested block authored as a <table>
 * arrives here as a literal table. We convert those tables into EDS block divs,
 * then decorate + load them explicitly.
 */

// Convert an authored block <table> into the EDS block-div structure
// (<div class="<name>"><div><div>cell</div>…</div>…</div>) that decorateBlock
// and loadBlock expect. The table's header cell text is the block name.
function tableToBlockDiv(table) {
  const rows = [...table.querySelectorAll(':scope > thead > tr, :scope > tbody > tr')];
  if (!rows.length) return null;

  const headerText = (table.querySelector('thead th, thead td') || {}).textContent || '';
  const blockName = headerText.trim().toLowerCase().replace(/\s+/g, '-');
  if (!blockName) return null;

  const blockEl = document.createElement('div');
  blockEl.className = blockName;

  rows.forEach((tr) => {
    // Skip the header row (block-name row).
    if (tr.querySelector(':scope > th')) return;
    const rowEl = document.createElement('div');
    [...tr.children].forEach((td) => {
      const colEl = document.createElement('div');
      while (td.firstChild) colEl.append(td.firstChild);
      rowEl.append(colEl);
    });
    blockEl.append(rowEl);
  });

  return blockEl;
}

// Module-scoped counter guarantees unique ids across multiple blocks on a page
// (Math.random / Date.now are unavailable in some sandboxes; a counter is stable).
let tabsFilterInstance = 0;

export default async function decorate(block) {
  tabsFilterInstance += 1;
  const instanceId = tabsFilterInstance;
  const rows = [...block.children];

  const tablist = document.createElement('div');
  tablist.className = 'tabs-filter-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const labelCell = cells[0];
    const panelCell = cells[1];

    const label = labelCell ? labelCell.textContent.trim() : `Tab ${i + 1}`;
    const tabId = `tabs-filter-${instanceId}-tab-${i}`;
    const panelId = `tabs-filter-${instanceId}-panel-${i}`;

    // Tab button
    const tab = document.createElement('button');
    tab.className = 'tabs-filter-tab';
    tab.type = 'button';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.textContent = label;

    // Panel — reuse the panel cell as the panel container so nested block
    // markup (e.g. a card grid) is preserved for downstream decoration.
    const panel = panelCell || document.createElement('div');
    panel.className = 'tabs-filter-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tabId);
    if (i !== 0) panel.setAttribute('hidden', '');

    tablist.append(tab);
    panels.push({ tab, panel });
  });

  const activate = (index) => {
    panels.forEach(({ tab, panel }, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    });
  };

  panels.forEach(({ tab }, i) => {
    tab.addEventListener('click', () => activate(i));
    tab.addEventListener('keydown', (e) => {
      let next;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % panels.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + panels.length) % panels.length;
      if (next === undefined) return;
      e.preventDefault();
      activate(next);
      panels[next].tab.focus();
    });
  });

  // Convert any nested block <table> in each panel into an EDS block div.
  const nested = [];
  panels.forEach(({ panel }) => {
    panel.querySelectorAll(':scope > table').forEach((table) => {
      const blockDiv = tableToBlockDiv(table);
      if (blockDiv) {
        table.replaceWith(blockDiv);
        nested.push(blockDiv);
      }
    });
  });

  block.textContent = '';
  block.append(tablist);
  panels.forEach(({ panel }) => block.append(panel));

  // Decorate + load the nested blocks (e.g. cards-article grids). EDS's
  // decorateBlocks skips these because they aren't top-level section rows.
  await Promise.all(nested.map(async (el) => {
    decorateBlock(el);
    await loadBlock(el);
  }));
}
