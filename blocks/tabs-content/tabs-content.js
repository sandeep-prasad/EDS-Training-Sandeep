/*
 * tabs-content — prose content switcher. Base: tabs.
 * A horizontal tab strip where each panel holds rich-text/body content
 * (Overview, Itinerary, What to Bring …), not a nested block.
 *
 * Content model (EDS table): one row per tab.
 *   cell 1 = tab label
 *   cell 2 = that tab's panel content
 * The first tab is shown by default. Missing cells are handled gracefully.
 */
let tabsContentInstance = 0;

export default function decorate(block) {
  tabsContentInstance += 1;
  const instanceId = tabsContentInstance;
  const rows = [...block.children];

  const tablist = document.createElement('div');
  tablist.className = 'tabs-content-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];

  rows.forEach((row, i) => {
    const cells = [...row.children];
    const labelCell = cells[0];
    const panelCell = cells[1];

    const label = labelCell ? labelCell.textContent.trim() : `Tab ${i + 1}`;
    const tabId = `tabs-content-${instanceId}-tab-${i}`;
    const panelId = `tabs-content-${instanceId}-panel-${i}`;

    const tab = document.createElement('button');
    tab.className = 'tabs-content-tab';
    tab.type = 'button';
    tab.id = tabId;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panelId);
    tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.textContent = label;

    const panel = panelCell || document.createElement('div');
    panel.className = 'tabs-content-panel';
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

  block.textContent = '';
  block.append(tablist);
  panels.forEach(({ panel }) => block.append(panel));
}
