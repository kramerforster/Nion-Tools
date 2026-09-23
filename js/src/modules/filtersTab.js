import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';

class FiltersManager {
    constructor() {
        this.filters = new Map();
        this.activeFilters = new Set();
        this.registerDefaultFilters();
    }

    registerDefaultFilters() {
        this.registerFilter('isVip', p => p.vip == 1, { priority: 90 });
        this.registerFilter('isMobile', p => p.mobile == 1, { priority: 9 });
        this.registerFilter('isPc', p => p.mobile == 0, { priority: 9 });
        this.registerFilter('isOfficials', p => p.color && ['CCFF00', '996633', 'FF6666', 'FF6600', '7F7F7F', '007575', 'C0C0C0'].some(c => p.color.toUpperCase().includes(c)), { priority: 80 });
    }

    registerFilter(name, fn, options = {}) {
        if (this.filters.has(name)) return false;
        this.filters.set(name, { fn, active: false, priority: options.priority ?? 0 });
        return true;
    }

    unregister(name) {
        this.deactivate(name);
        return this.filters.delete(name);
    }

    activate(name) {
        const f = this.filters.get(name);
        if (!f) return false;
        f.active = true;
        this.activeFilters.add(name);
        return true;
    }

    deactivate(name) {
        const f = this.filters.get(name);
        if (!f) return false;
        f.active = false;
        this.activeFilters.delete(name);
        return true;
    }

    toggle(name) {
        const f = this.filters.get(name);
        if (!f) return false;
        return f.active ? this.deactivate(name) : this.activate(name);
    }

    apply(players) {
        if (this.activeFilters.size === 0) return players;
        const active = [...this.activeFilters].map(name => this.filters.get(name)).filter(Boolean).sort((a, b) => b.priority - a.priority);
        return active.length === 0 ? players : players.filter(p => active.every(f => Boolean(f.fn(p))));
    }

    get(name) {
        return this.filters.get(name);
    }
}

const filtersInstance = new FiltersManager();
let lastPayload = null;
let isPanelOpen = false;
let activeTag = 'all';
let savedFilters = {
    minLvl: '',
    maxLvl: '',
    minPing: '',
    maxPing: '',
    activeTag: 'all'
};

const Names = ['isVip', 'isMobile', 'isPc', 'isOfficials'];
const Filter = { vip: 'isVip', pc: 'isPc', mobile: 'isMobile', officials: 'isOfficials' };
const Categories = [
    { id: 'all', label: 'Все' },
    { id: 'vip', label: 'VIP' },
    { id: 'pc', label: 'PC' },
    { id: 'mobile', label: 'Mobile' },
    { id: 'officials', label: 'Госники' },
];

const saveFilters = () => {
    savedFilters = {
        minLvl: document.getElementById('filter-min-lvl')?.value ?? '',
        maxLvl: document.getElementById('filter-max-lvl')?.value ?? '',
        minPing: document.getElementById('filter-min-ping')?.value ?? '',
        maxPing: document.getElementById('filter-max-ping')?.value ?? '',
        activeTag
    };
};

    window.onUpdatePlayersList = new Proxy(window.onUpdatePlayersList, {
        apply(target, thisArg, args) {
            lastPayload = args[0];
                const filteredPayload = {...lastPayload, players: filtersInstance.apply(lastPayload.players)};
                args[0] = filteredPayload;
            return Reflect.apply(target, thisArg, args);
        },
    });

const createNumberInput = (id, defaultVal, onChange) => {
    const input = document.createElement('input');
    input.id = id;
    input.value = defaultVal;
    input.style.width = '7vh';
    input.style.background = 'rgba(0, 0, 0, 0.6)';
    input.style.border = '1px solid rgba(238, 238, 230, 0.15)';
    input.style.borderRadius = '0.4vh';
    input.style.color = '#ffb110';
    input.style.fontFamily = "'Open Sans', sans-serif";
    input.style.fontSize = '1.3vh';
    input.style.fontWeight = '700';
    input.style.textAlign = 'center';
    input.style.padding = '0.3vh';
    input.style.outline = 'none';
    input.style.transition = 'border-color 0.15s';

    input.addEventListener('focus', () => input.style.borderColor = '#ffb110');
    input.addEventListener('blur', () => input.style.borderColor = 'rgba(238, 238, 230, 0.15)');
    input.addEventListener('input', onChange);

    return input;
};

const applyTagButtonStyle = (btn, active) => {
    if (active) {
        btn.style.borderColor = '#ffb110';
        btn.style.color = '#ffb110';
        btn.style.background = 'rgba(255, 177, 16, 0.05)';
    } else {
        btn.style.borderColor = 'rgba(238, 238, 230, 0.15)';
        btn.style.color = '#eeeee6aa';
        btn.style.background = 'rgba(238, 238, 230, 0.05)';
    }
};

const createTagButton = (id, label, tag) => {
    const btn = document.createElement('button');
    btn.id = `filter-tag-${id}`;
    btn.textContent = label;
    btn.style.background = 'rgba(238, 238, 230, 0.05)';
    btn.style.border = '1px solid rgba(238, 238, 230, 0.15)';
    btn.style.borderRadius = '0.4vh';
    btn.style.color = '#eeeee6aa';
    btn.style.fontFamily = "'Open Sans', sans-serif";
    btn.style.fontSize = '1.1vh';
    btn.style.fontWeight = '700';
    btn.style.padding = '0.4vh 1.2vh';
    btn.style.marginRight = '0.8vh';
    btn.style.transition = 'all 0.15s';

    btn.addEventListener('mouseenter', () => {
        if (activeTag !== id) {
            btn.style.background = 'rgba(238, 238, 230, 0.1)';
            btn.style.color = '#eeeee6';
        }
    });
    btn.addEventListener('mouseleave', () => {
        if (activeTag !== id) applyTagButtonStyle(btn, false);
    });
    btn.addEventListener('click', () => {
        activeTag = tag;
        Names.forEach(name => filtersInstance.deactivate(name));
        const filterName = Filter[tag];
        if (filterName) filtersInstance.activate(filterName);
        saveFilters();
        updateTagButtons();
        window.onUpdatePlayersList(lastPayload);
        updateUI();
    });

    applyTagButtonStyle(btn, id === activeTag);
    return btn;
};

const updateTagButtons = () => {
    Categories.forEach(({ id }) => {
        const btn = document.getElementById(`filter-tag-${id}`);
        if (!btn) return;
        const isActive = id === activeTag;
        btn.classList.toggle('active', isActive);
        applyTagButtonStyle(btn, isActive);
    });
};

const buildFilterRow = (labelText, isLast = false) => {
    const row = document.createElement('div');
    row.className = 'filter-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.justifyContent = 'space-between';
    row.style.height = '3vh';
    if (!isLast) row.style.marginBottom = '1vh';

    const label = document.createElement('div');
    label.textContent = labelText;
    label.style.fontFamily = "'Open Sans', sans-serif";
    label.style.fontWeight = '700';
    label.style.fontSize = '1.25vh';
    label.style.color = '#eeeee699';
    label.style.letterSpacing = '0.05vh';

    row.appendChild(label);
    return row;
};

const buildRangeInputs = (minId, maxId, minVal, maxVal, onChange) => {
    const wrap = document.createElement('div');
    wrap.className = 'filter-inputs-wrap';
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';

    wrap.appendChild(createNumberInput(minId, minVal ?? '', onChange));

    const sep = document.createElement('span');
    sep.textContent = '—';
    sep.style.color = '#eeeee666';
    sep.style.fontSize = '1.2vh';
    sep.style.margin = '0 1vh';
    wrap.appendChild(sep);

    wrap.appendChild(createNumberInput(maxId, maxVal ?? '', onChange));
    return wrap;
};

const createToggleButton = () => {
    const btn = document.createElement('button');
    btn.id = 'players-online-filter-toggle';
    btn.style.background = '#ffb110';
    btn.style.color = '#0c0a06';
    btn.style.border = 'none';
    btn.style.borderRadius = '0.6vh';
    btn.style.padding = '0.6vh 1.4vh';
    btn.style.fontFamily = "'Open Sans', sans-serif";
    btn.style.fontSize = '1.3vh';
    btn.style.fontWeight = '800';
    btn.style.display = 'flex';
    btn.style.alignItems = 'center';
    btn.style.transition = 'all 0.15s';
    btn.style.zIndex = '99';
    btn.style.height = '3.2vh';

    btn.style.position = 'absolute';
    btn.style.right = '15vh';
    btn.style.top = '50%';
    btn.style.transform = 'translateY(-50%)';

    const text = document.createElement('span');
    text.textContent = 'Фильтры';
    text.style.marginRight = '0.6vh';
    btn.appendChild(text);

    const dot = document.createElement('span');
    dot.className = 'toggle-dot';
    dot.style.color = '#0c0a06';
    dot.style.fontSize = '1.2vh';
    dot.style.lineHeight = '1';
    dot.style.display = 'none';
    btn.appendChild(dot);

    btn.addEventListener('mouseenter', () => btn.style.background = '#ffd786');
    btn.addEventListener('mouseleave', () => btn.style.background = '#ffb110');
    btn.addEventListener('click', () => {
        isPanelOpen = !isPanelOpen;
        updatePanelVisibility();
    });

    return btn;
};

const createFilterPanel = () => {
    const panel = document.createElement('div');
    panel.id = 'players-online-inline-filters';
    panel.style.background = 'rgba(12, 10, 6, 0.95)';
    panel.style.border = '1px solid rgba(255, 177, 16, 0.15)';
    panel.style.borderRadius = '1vh';
    panel.style.margin = '0.8vh 2.22vh 1.2vh 2.22vh';
    panel.style.padding = '1.2vh 1.8vh';
    panel.style.display = 'none';
    panel.style.flexDirection = 'column';
    panel.style.zIndex = '99';

    const rowLvl = buildFilterRow('Уровень');
    const rangeLvl = buildRangeInputs('filter-min-lvl', 'filter-max-lvl', savedFilters.minLvl, savedFilters.maxLvl, () => {
        const minValRaw = document.getElementById('filter-min-lvl')?.value;
        const maxValRaw = document.getElementById('filter-max-lvl')?.value;
        filtersInstance.unregister('dynamicLevel');
        if (minValRaw || maxValRaw) {
            const minVal = minValRaw ? parseInt(minValRaw, 10) : 0;
            const maxVal = maxValRaw ? parseInt(maxValRaw, 10) : Infinity;
            filtersInstance.registerFilter('dynamicLevel', p => {
                const lvl = Number(p.score);
                return lvl >= minVal && lvl <= maxVal;
            }, { priority: 75 });

            filtersInstance.activate('dynamicLevel');
        }
        saveFilters();
        window.onUpdatePlayersList(lastPayload);
        updateUI();
    });
    rowLvl.appendChild(rangeLvl);
    panel.appendChild(rowLvl);

    const rowPing = buildFilterRow('Пинг');
    const rangePing = buildRangeInputs('filter-min-ping', 'filter-max-ping', savedFilters.minPing, savedFilters.maxPing, () => {
        const minValRaw = document.getElementById('filter-min-ping')?.value;
        const maxValRaw = document.getElementById('filter-max-ping')?.value;
        filtersInstance.unregister('dynamicPing');
        if (minValRaw || maxValRaw) {
            const minVal = minValRaw ? parseInt(minValRaw, 10) : 0;
            const maxVal = maxValRaw ? parseInt(maxValRaw, 10) : Infinity;
            filtersInstance.registerFilter('dynamicPing', p => {
                const ping = Number(p.ping);
                return ping >= minVal && ping <= maxVal;
            }, { priority: 75 });

            filtersInstance.activate('dynamicPing');
        }
        saveFilters();
        window.onUpdatePlayersList(lastPayload);
        updateUI();
    });
    rowPing.appendChild(rangePing);
    panel.appendChild(rowPing);

    const rowTags = buildFilterRow('Категория', true);
    const tags = document.createElement('div');
    tags.className = 'filter-tags-wrap';
    tags.style.display = 'flex';

    Categories.forEach(cat => {
        tags.appendChild(createTagButton(cat.id, cat.label, cat.id));
    });

    rowTags.appendChild(tags);
    panel.appendChild(rowTags);

    return panel;
};

const Filters = () => {
    const header = document.querySelector('.players-online__content__header');
    if (!header) return;

    if (!document.getElementById('players-online-filter-toggle')) {
        const btn = createToggleButton();
        const infoEl = header.querySelector('.players-online__content__header__info');
        header.insertBefore(btn, infoEl);
    }

    const content = document.querySelector('.players-online__content');
    const table = document.querySelector('.players-online__content__table');
    if (content && table && !document.getElementById('players-online-inline-filters')) {
        if (savedFilters.activeTag) activeTag = savedFilters.activeTag;
        const panel = createFilterPanel();
        content.insertBefore(panel, table);
        updateTagButtons();
    }

    updatePanelVisibility();
    updateUI();
};

const updatePanelVisibility = () => {
    const panel = document.getElementById('players-online-inline-filters');
    if (panel) panel.style.display = isPanelOpen ? 'flex' : 'none';
};

const updateUI = () => {
    updateTagButtons();
    const minLvl = document.getElementById('filter-min-lvl')?.value || '';
    const maxLvl = document.getElementById('filter-max-lvl')?.value || '';
    const minPing = document.getElementById('filter-min-ping')?.value || '';
    const maxPing = document.getElementById('filter-max-ping')?.value || '';
    const hasFilters = (activeTag !== 'all') || minLvl !== '' || maxLvl !== '' || minPing !== '' || maxPing !== '';
    const dot = document.querySelector('#players-online-filter-toggle .toggle-dot');
    if (dot) dot.style.display = hasFilters ? 'inline' : 'none';
};

export const filtersTab = () => {
    InterfaceManager.registerInterfaceListener('PlayersOnline', () => {
        if (!info.auth) return;
        InterfaceManager.executeFunctionWhen(Filters, () => !!document.querySelector('.players-online__content__header'));
        window.onUpdatePlayersList(lastPayload);
        updateUI();
    });
    return {
        name: 'FiltersTab',
        filters: filtersInstance,
        destroy: () => {
            document.getElementById('players-online-filter-toggle')?.remove();
            document.getElementById('players-online-inline-filters')?.remove();
            lastPayload = null;
            isPanelOpen = false;
        }
    };
};

export default filtersTab;