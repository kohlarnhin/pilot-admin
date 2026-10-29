/* Synthetic, framework-neutral example. Replace the source adapter, not the UI contract. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const app = $('pilot-app');
  const scroller = $('pilot-table-scroll');
  const tbody = $('pilot-rows');
  const table = tbody.closest('table');
  const region = $('pilot-table-region');
  const PAGE_SIZE = 50;
  const ROW_HEIGHT = 56;
  const HEADER_HEIGHT = 44;
  const OVERSCAN = 10;
  const state = {
    records: [], page: 1, hasNext: true, busy: false, version: 0,
    firstLoading: true, error: null, failedFirst: false, query: { keyword: '', status: 'all' },
    total: null, requests: 0, stalledPages: 0,
  };
  let controller = null;
  let frame = null;
  let previousRange = '';
  const resources = Array.from({ length: 360 }, (_, index) => ({
    id: `resource-${index + 1}`,
    code: `pilot.resource.${String(index + 1).padStart(4, '0')}`,
    name: ['Operations', 'Customer support', 'Inventory', 'Analytics'][index % 4] + ` resource ${index + 1}`,
    status: index % 5 === 0 ? 'paused' : 'enabled',
    updated: '2026-09-08 09:' + String(index % 60).padStart(2, '0'),
  }));

  async function syntheticSource({ page, pageSize, query, signal }) {
    await new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Canceled', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 100);
      if (signal.aborted) abort();
      else signal.addEventListener('abort', abort, { once: true });
    });
    const keyword = query.keyword.toLowerCase();
    const filtered = resources.filter((record) =>
      (query.status === 'all' || record.status === query.status)
      && `${record.code} ${record.name}`.toLowerCase().includes(keyword));
    const offset = (page - 1) * pageSize;
    return { records: filtered.slice(offset, offset + pageSize), hasNext: offset + pageSize < filtered.length, total: filtered.length };
  }

  // An optional adapter permits isolated error/race tests without any real service.
  const fetchPage = typeof window.pilotExampleDataSource === 'function' ? window.pilotExampleDataSource : syntheticSource;

  function publishState() {
    app.dataset.loadedCount = String(state.records.length);
    app.dataset.requestCount = String(state.requests);
    app.dataset.loading = String(state.busy);
    app.dataset.hasNext = String(state.hasNext);
    app.dataset.queryVersion = String(state.version);
    region.setAttribute('aria-busy', String(state.firstLoading));
    $('pilot-refresh-button').disabled = state.busy;
    $('pilot-total').textContent = Number.isFinite(state.total) ? `${state.total} resources` : `Loaded ${state.records.length}`;
  }

  function cell(text, className = '') {
    const td = document.createElement('td');
    const span = document.createElement('span');
    span.className = 'pilot-truncate ' + className;
    span.textContent = text;
    span.title = text;
    td.append(span);
    return td;
  }

  function spacer(height) {
    const tr = document.createElement('tr');
    tr.className = 'pilot-spacer';
    tr.setAttribute('aria-hidden', 'true');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.style.height = `${height}px`;
    tr.append(td);
    return tr;
  }

  function recordRow(record, index) {
    const tr = document.createElement('tr');
    tr.className = 'pilot-record-row';
    tr.dataset.recordId = record.id;
    tr.setAttribute('aria-rowindex', String(index + 2));
    tr.append(cell(record.code, 'pilot-mono'), cell(record.name));
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'pilot-badge ' + (record.status === 'enabled' ? 'pilot-badge--success' : 'pilot-badge--warning');
    badge.textContent = record.status === 'enabled' ? 'Enabled' : 'Paused';
    statusCell.append(badge);
    tr.append(statusCell, cell(record.updated, 'pilot-mono pilot-muted'));
    const actions = document.createElement('td');
    actions.className = 'pilot-action-cell';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pilot-btn pilot-btn--ghost pilot-row-action';
    button.dataset.viewId = record.id;
    button.setAttribute('aria-label', `View ${record.name}`);
    button.title = 'View details';
    button.innerHTML = '<svg aria-hidden="true"><use href="#pilot-eye"/></svg>';
    actions.append(button);
    tr.append(actions);
    return tr;
  }

  function renderRows(force = false) {
    if (state.firstLoading) {
      if (previousRange === 'skeleton' && !force) return;
      previousRange = 'skeleton';
      tbody.replaceChildren(...Array.from({ length: 7 }, () => {
        const tr = document.createElement('tr');
        tr.setAttribute('aria-hidden', 'true');
        for (let index = 0; index < 5; index++) {
          const td = document.createElement('td');
          const bar = document.createElement('div');
          bar.className = 'pilot-skeleton';
          bar.style.width = index === 4 ? '24px' : '75%';
          td.append(bar); tr.append(td);
        }
        return tr;
      }));
      return;
    }
    const start = Math.max(0, Math.floor(Math.max(0, scroller.scrollTop - HEADER_HEIGHT) / ROW_HEIGHT) - OVERSCAN);
    const end = Math.min(state.records.length, Math.ceil(Math.max(0, scroller.scrollTop + scroller.clientHeight - HEADER_HEIGHT) / ROW_HEIGHT) + OVERSCAN);
    const range = `${start}:${end}:${state.records.length}`;
    if (!force && previousRange === range) return;
    previousRange = range;
    const focusedId = tbody.contains(document.activeElement) ? document.activeElement.dataset.viewId : null;
    const children = [];
    if (start > 0) children.push(spacer(start * ROW_HEIGHT));
    for (let index = start; index < end; index++) children.push(recordRow(state.records[index], index));
    if (end < state.records.length) children.push(spacer((state.records.length - end) * ROW_HEIGHT));
    tbody.replaceChildren(...children);
    table.setAttribute('aria-rowcount', String((Number.isFinite(state.total) ? state.total : state.records.length) + 1));
    if (focusedId) {
      const restored = Array.from(tbody.querySelectorAll('button')).find((button) => button.dataset.viewId === focusedId);
      (restored || scroller).focus({ preventScroll: true });
    }
  }

  function renderState() {
    const empty = !state.firstLoading && state.records.length === 0;
    scroller.hidden = empty;
    $('pilot-empty').hidden = !empty;
    $('pilot-empty-title').textContent = state.error ? 'Resources could not be loaded' : 'No resources found';
    $('pilot-empty-description').textContent = state.error ? 'Try again to retrieve this resource list.' : 'Try a different name or clear your search.';
    $('pilot-initial-retry').hidden = !state.error;
    $('pilot-feedback').hidden = !state.error || empty;
    publishState();
    renderRows(true);
  }

  function shouldPrefetch() {
    const distance = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    return Math.max(0, distance - scroller.scrollTop) <= Math.max(1200, distance * .5);
  }

  async function requestPage(first = false, explicitRetry = false) {
    if (state.busy || (!first && !state.hasNext) || (state.error && !explicitRetry)) return;
    const version = state.version;
    const pageNo = first ? 1 : state.page;
    const query = { ...state.query };
    state.busy = true;
    state.error = null;
    state.requests++;
    publishState();
    try {
      const page = await fetchPage({ page: pageNo, pageSize: PAGE_SIZE, query, signal: controller.signal });
      if (version !== state.version) return;
      if (!Array.isArray(page.records) || (page.records.length === 0 && page.hasNext)) throw new Error('Invalid continuation');
      const merged = new Map((first ? [] : state.records).map((record) => [record.id, record]));
      const before = merged.size;
      page.records.forEach((record) => merged.set(record.id, record));
      state.stalledPages = !first && merged.size === before && page.hasNext ? state.stalledPages + 1 : 0;
      if (state.stalledPages >= 2) throw new Error('No pagination progress');
      state.records = Array.from(merged.values());
      state.total = Number.isFinite(page.total) ? page.total : null;
      state.hasNext = Boolean(page.hasNext);
      state.page = pageNo + 1;
      if (first) scroller.scrollTop = 0;
      $('pilot-announcement').textContent = `${state.records.length} resources loaded.`;
    } catch (error) {
      if (version !== state.version || error.name === 'AbortError') return;
      state.error = error;
      state.failedFirst = first;
    } finally {
      if (version === state.version) {
        state.busy = false;
        state.firstLoading = false;
        renderState();
        schedule();
      }
    }
  }

  function schedule() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      renderRows();
      if (!state.busy && !state.error && state.hasNext && !state.firstLoading && shouldPrefetch()) void requestPage();
    });
  }

  function newQuery(refresh = false) {
    controller?.abort();
    controller = new AbortController();
    state.version++;
    state.busy = false;
    state.error = null;
    state.failedFirst = false;
    state.hasNext = true;
    state.page = 1;
    state.stalledPages = 0;
    state.firstLoading = !refresh || state.records.length === 0;
    if (!refresh) { state.records = []; state.total = null; scroller.scrollTop = 0; }
    renderState();
    void requestPage(true);
  }

  function setHistory(open) {
    $('pilot-history').hidden = !open;
    $('pilot-history-button').setAttribute('aria-expanded', String(open));
    schedule();
  }

  function setMobileNavigation(open) {
    app.classList.toggle('is-nav-open', open);
    $('pilot-mobile-menu')?.setAttribute('aria-expanded', String(open));
  }

  $('pilot-search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    state.query.keyword = $('pilot-search-input').value.trim();
    newQuery();
  });
  $('pilot-refresh-button').addEventListener('click', () => newQuery(true));
  $('pilot-initial-retry').addEventListener('click', () => newQuery());
  $('pilot-append-retry').addEventListener('click', () => void requestPage(state.failedFirst, true));
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((item) => item.removeAttribute('aria-current'));
    button.setAttribute('aria-current', 'page');
    state.query.status = button.dataset.filter;
    setMobileNavigation(false);
    newQuery();
  }));
  $('pilot-collapse').addEventListener('click', () => {
    const collapsed = app.classList.toggle('is-collapsed');
    $('pilot-collapse').setAttribute('aria-expanded', String(!collapsed));
    $('pilot-collapse').setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  });
  $('pilot-mobile-menu')?.addEventListener('click', () => setMobileNavigation(!app.classList.contains('is-nav-open')));
  $('pilot-nav-mask').addEventListener('click', () => setMobileNavigation(false));
  $('pilot-history-button').addEventListener('click', () => setHistory($('pilot-history').hidden));
  $('pilot-history-close').addEventListener('click', () => { setHistory(false); $('pilot-history-button').focus(); });

  tbody.addEventListener('click', (event) => {
    const button = event.target.closest('[data-view-id]');
    if (!button) return;
    const record = state.records.find((item) => item.id === button.dataset.viewId);
    if (!record) return;
    const body = $('pilot-detail-body');
    body.replaceChildren();
    const metadata = document.createElement('dl');
    metadata.className = 'pilot-dialog-meta';
    for (const [label, value] of [['Code', record.code], ['Status', record.status], ['Name', record.name], ['Updated', record.updated]]) {
      const block = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = label;
      const dd = document.createElement('dd'); dd.textContent = value;
      block.append(dt, dd); metadata.append(block);
    }
    body.append(metadata);
    for (let index = 1; index <= 16; index++) {
      const paragraph = document.createElement('p');
      paragraph.textContent = `Activity note ${index}. ${record.name} is maintained by the admin team. Review its associated content and availability before making changes. Related records remain available in the resource list.`;
      body.append(paragraph);
    }
    $('pilot-detail').showModal();
    $('pilot-detail-title').focus();
  });
  $('pilot-detail-close').addEventListener('click', () => $('pilot-detail').close());
  $('pilot-detail-done').addEventListener('click', () => $('pilot-detail').close());

  for (let index = 0; index < 60; index++) {
    const item = document.createElement('li');
    const title = document.createElement('strong'); title.textContent = `Resource ${index + 1} updated`; title.style.fontWeight = '500';
    const description = document.createElement('p'); description.textContent = 'Admin team reviewed the resource and updated its shared configuration.';
    const time = document.createElement('time'); time.className = 'pilot-mono pilot-muted'; time.dateTime = '2026-09-08T09:00:00'; time.textContent = '2026-09-08 09:00';
    item.append(title, description, time); $('pilot-history-list').append(item);
  }
  scroller.addEventListener('scroll', schedule, { passive: true });
  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(scroller);
  window.addEventListener('pagehide', () => {
    state.version++;
    controller?.abort();
    resizeObserver.disconnect();
    scroller.removeEventListener('scroll', schedule);
    if (frame !== null) cancelAnimationFrame(frame);
  }, { once: true });
  newQuery();
})();
