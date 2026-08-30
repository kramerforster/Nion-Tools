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
        this.registerFilter('isOfficials', p => p.color && ['CCFF00', '996633', 'FF6666', 'FF6600', '7F7F7F', '007575', 'C0C0C0'].some(c => p.color.toUpperCase().includes(c)), { priority: 80 });
    }
    registerFilter(name, fn, options = {}) {
        if (this.filters.has(name)) return false;
        this.filters.set(name, { fn, active: false, priority: options.priority });
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
        if (!Array.isArray(players)) return;
        const active = [...this.activeFilters].map(name => this.filters.get(name)).filter(Boolean).sort((a, b) => b.priority - a.priority);
        return active.length === 0 ? players : players.filter(p => active.every(f => Boolean(f.fn(p))));
    }
    get(name) {
        return this.filters.get(name);
    }
}

let filtersInstance = null;
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

const saveFilters = () => {
    savedFilters = {
        minLvl: document.getElementById('filter-min-lvl').value,
        maxLvl: document.getElementById('filter-max-lvl').value,
        minPing: document.getElementById('filter-min-ping').value,
        maxPing: document.getElementById('filter-max-ping').value,
        activeTag
    };
};
const Players = () => {
    window.onUpdatePlayersList = new Proxy(window.onUpdatePlayersList, {
        apply(target, thisArg, args) {
            lastPayload = args[0];
            Reflect.apply(target, thisArg, args);
            const tab = window.interface('PlayersOnline');
            if (tab.setInterfaceParams) tab.setInterfaceParams({...lastPayload, players: filtersInstance.apply(lastPayload.players) });
        }
    });
    return true;
};

const recalculate = () => {
    const refresh = () => {
        const tab = window.interface('PlayersOnline');
        if (tab.setInterfaceParams) tab.setInterfaceParams({...lastPayload, players: filtersInstance.apply(lastPayload.players) });
    };
    if (Players()) {
        refresh();
        updateUI();
        return;
    }
    InterfaceManager.executeFunctionWhen(() => {
        Players();
        refresh();
        updateUI();
    }, () => window.onUpdatePlayersList);
};

const setLevelFilter = (min, max = Infinity) => {
    filtersInstance.unregister('dynamicLevel');
    filtersInstance.registerFilter('dynamicLevel', p => {
        const lvl = Number(p.level);
        return lvl >= min && lvl <= max;
    }, { priority: 75 });
    filtersInstance.activate('dynamicLevel');
    recalculate();
};

const setPingFilter = (min, max = Infinity) => {
    filtersInstance.unregister('dynamicPing');
    filtersInstance.registerFilter('dynamicPing', p => {
        const ping = Number(p.ping);
        return ping >= min && ping <= max
    }, { priority: 75 });
    filtersInstance.activate('dynamicPing');
    recalculate();
};

const handleLevelChange = () => {
    const minVal = parseInt(document.getElementById('filter-min-lvl') ?.value || 0, 10);
    const maxValRaw = document.getElementById('filter-max-lvl') ?.value;
    const maxVal = maxValRaw ? parseInt(maxValRaw, 10) : Infinity;

    if (minVal === 0 && maxVal === Infinity) {
        filtersInstance.unregister('dynamicLevel');
    } else {
        setLevelFilter(minVal, maxVal);
    }
    saveFilters();
    recalculate();
};
const handlePingChange = () => {
    const minValRaw = document.getElementById('filter-min-ping') ?.value;
    const maxValRaw = document.getElementById('filter-max-ping') ?.value;

    if (!minValRaw && !maxValRaw) {
        filtersInstance.unregister('dynamicPing');
    } else {
        const minVal = minValRaw ? parseInt(minValRaw, 10) : 0;
        const maxVal = maxValRaw ? parseInt(maxValRaw, 10) : Infinity;
        setPingFilter(minVal, maxVal);
    }
    saveFilters();
    recalculate();
};
const createNumberInput = (id, defaultVal, onChange) => {
    const input = document.createElement('input');
    input.type = 'number';
    input.id = id;
    input.value = defaultVal;
    input.min = '0';
    input.style.width = "7vh";
    input.style.background = "rgba(0, 0, 0, 0.6)";
    input.style.border = "1px solid rgba(238, 238, 230, 0.15)";
    input.style.borderRadius = "0.4vh";
    input.style.color = "#ffb110";
    input.style.fontFamily = "'Open Sans', sans-serif";
    input.style.fontSize = "1.3vh";
    input.style.fontWeight = "700";
    input.style.textAlign = "center";
    input.style.padding = "0.3vh";
    input.style.outline = "none";
    input.style.transition = "border-color 0.15s";

    input.addEventListener('focus', () => input.style.borderColor = "#ffb110");
    input.addEventListener('blur', () => input.style.borderColor = "rgba(238, 238, 230, 0.15)");
    input.addEventListener('input', onChange);

    return input;
};

const createTagButton = (id, label, tag) => {
    const btn = document.createElement('button');
    btn.id = `filter-tag-${id}`;
    btn.textContent = label;
    btn.style.background = "rgba(238, 238, 230, 0.05)";
    btn.style.border = "1px solid rgba(238, 238, 230, 0.15)";
    btn.style.borderRadius = "0.4vh";
    btn.style.color = "#eeeee6aa";
    btn.style.fontFamily = "'Open Sans', sans-serif";
    btn.style.fontSize = "1.1vh";
    btn.style.fontWeight = "700";
    btn.style.padding = "0.4vh 1.2vh";
    btn.style.cursor = "pointer";
    btn.style.transition = "all 0.15s";
    btn.addEventListener('mouseenter', () => {
        if (activeTag !== id) {
            btn.style.background = "rgba(238, 238, 230, 0.1)";
            btn.style.color = "#eeeee6";
        }
    });
    btn.addEventListener('mouseleave', () => {
        if (activeTag !== id) {
            btn.style.background = "rgba(238, 238, 230, 0.05)";
            btn.style.color = "#eeeee6aa";
        }
    });
    btn.addEventListener('click', () => {
        activeTag = tag;
        filtersInstance.deactivate('isVip');
        filtersInstance.deactivate('isMobile');
        filtersInstance.deactivate('isOfficials');
        if (tag === 'vip') filtersInstance.activate('isVip');
        else if (tag === 'mobile') filtersInstance.activate('isMobile');
        else if (tag === 'officials') filtersInstance.activate('isOfficials');
        saveFilters();
        updateTagButtons();
        recalculate();
    });

    if (id === activeTag) {
        btn.style.borderColor = "#ffb110";
        btn.style.color = "#ffb110";
        btn.style.background = "rgba(255, 177, 16, 0.05)";
    }

    return btn;
};

const applyTagButtonStyle = (btn, id, active) => {
    if (active) {
        btn.style.borderColor = "#ffb110";
        btn.style.color = "#ffb110";
        btn.style.background = "rgba(255, 177, 16, 0.05)";
    } else {
        btn.style.borderColor = "rgba(238, 238, 230, 0.15)";
        btn.style.color = "#eeeee6aa";
        btn.style.background = "rgba(238, 238, 230, 0.05)";
    }
};

const updateTagButtons = () => {
    ['all', 'vip', 'mobile', 'officials'].forEach(tag => {
        const btn = document.getElementById(`filter-tag-${tag}`);
        if (!btn) return;
        const isActive = tag === activeTag;
        btn.classList.toggle('active', isActive);
        applyTagButtonStyle(btn, tag, isActive);
    });
};

const Filters = () => {
    const header = document.querySelector('.players-online__content__header');

    if (!document.getElementById('players-online-filter-toggle')) {
        const btn = document.createElement('button');
        btn.id = 'players-online-filter-toggle';
        btn.style.background = "#ffb110";
        btn.style.color = "#0c0a06";
        btn.style.border = "none";
        btn.style.borderRadius = "0.6vh";
        btn.style.padding = "0.6vh 1.4vh";
        btn.style.fontFamily = "'Open Sans', sans-serif";
        btn.style.fontSize = "1.3vh";
        btn.style.fontWeight = "800";
        btn.style.cursor = "pointer";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.gap = "0.6vh";
        btn.style.transition = "all 0.15s";
        btn.style.zIndex = "99";
        btn.style.height = "3.2vh";
        btn.style.marginLeft = "auto";
        btn.style.marginRight = "1.5vh";
        const text = document.createElement('span');
        text.textContent = 'Фильтры';
        btn.appendChild(text);

        const dot = document.createElement('span');
        dot.className = 'toggle-dot';
        dot.style.color = "#0c0a06";
        dot.style.fontSize = "1.2vh";
        dot.style.lineHeight = "1";
        dot.style.display = "none";
        btn.appendChild(dot);
        btn.addEventListener('mouseenter', () => btn.style.background = "#ffd786");
        btn.addEventListener('mouseleave', () => btn.style.background = "#ffb110");
        btn.addEventListener('click', () => {
            isPanelOpen = !isPanelOpen;
            updatePanelVisibility()
        });
        const info = header.querySelector('.players-online__content__header__info');
        header.insertBefore(btn, info);
    }

    const content = document.querySelector('.players-online__content');
    const table = document.querySelector('.players-online__content__table');
    if (content && table && !document.getElementById('players-online-inline-filters')) {
        const panel = document.createElement('div');
        panel.id = 'players-online-inline-filters';
        panel.style.background = "rgba(12, 10, 6, 0.95)";
        panel.style.border = "1px solid rgba(255, 177, 16, 0.15)";
        panel.style.borderRadius = "1vh";
        panel.style.margin = "0.8vh 2.22vh 1.2vh 2.22vh";
        panel.style.padding = "1.2vh 1.8vh";
        panel.style.display = "none";
        panel.style.flexDirection = "column";
        panel.style.gap = "1vh";
        panel.style.zIndex = "99";

        const row1 = document.createElement('div');
        row1.className = 'filter-row';
        row1.style.display = "flex";
        row1.style.alignItems = "center";
        row1.style.justifyContent = "space-between";
        row1.style.height = "3vh";

        const label1 = document.createElement('div');
        label1.textContent = 'Уровень';
        label1.style.fontFamily = "'Open Sans', sans-serif";
        label1.style.fontWeight = "700";
        label1.style.fontSize = "1.25vh";
        label1.style.color = "#eeeee699";
        label1.style.letterSpacing = "0.05vh";

        const inputs1 = document.createElement('div');
        inputs1.className = 'filter-inputs-wrap';
        inputs1.style.display = "flex";
        inputs1.style.alignItems = "center";
        inputs1.style.gap = "1vh";

        inputs1.appendChild(createNumberInput('filter-min-lvl', savedFilters.minLvl ?? '', handleLevelChange));

        const sep1 = document.createElement('span');
        sep1.textContent = '—';
        sep1.style.color = "#eeeee666";
        sep1.style.fontSize = "1.2vh";
        inputs1.appendChild(sep1);

        inputs1.appendChild(createNumberInput('filter-max-lvl', savedFilters.maxLvl ?? '', handleLevelChange));

        row1.appendChild(label1);
        row1.appendChild(inputs1);
        panel.appendChild(row1);

        const rowPing = document.createElement('div');
        rowPing.className = 'filter-row';
        rowPing.style.display = "flex";
        rowPing.style.alignItems = "center";
        rowPing.style.justifyContent = "space-between";
        rowPing.style.height = "3vh";

        const labelPing = document.createElement('div');
        labelPing.textContent = 'Пинг';
        labelPing.style.fontFamily = "'Open Sans', sans-serif";
        labelPing.style.fontWeight = "700";
        labelPing.style.fontSize = "1.25vh";
        labelPing.style.color = "#eeeee699";
        labelPing.style.letterSpacing = "0.05vh";

        const inputsPing = document.createElement('div');
        inputsPing.className = 'filter-inputs-wrap';
        inputsPing.style.display = "flex";
        inputsPing.style.alignItems = "center";
        inputsPing.style.gap = "1vh";

        inputsPing.appendChild(createNumberInput('filter-min-ping', savedFilters.minPing ?? '', handlePingChange));

        const sepPing = document.createElement('span');
        sepPing.textContent = '—';
        sepPing.style.color = "#eeeee666";
        sepPing.style.fontSize = "1.2vh";
        inputsPing.appendChild(sepPing);
        inputsPing.appendChild(createNumberInput('filter-max-ping', savedFilters.maxPing ?? '', handlePingChange));
        rowPing.appendChild(labelPing);
        rowPing.appendChild(inputsPing);
        panel.appendChild(rowPing);

        const row2 = document.createElement('div');
        row2.className = 'filter-row';
        row2.style.display = "flex";
        row2.style.alignItems = "center";
        row2.style.justifyContent = "space-between";
        row2.style.height = "3vh";

        const label2 = document.createElement('div');
        label2.textContent = 'Категория';
        label2.style.fontFamily = "'Open Sans', sans-serif";
        label2.style.fontWeight = "700";
        label2.style.fontSize = "1.25vh";
        label2.style.color = "#eeeee699";
        label2.style.letterSpacing = "0.05vh";

        const tags = document.createElement('div');
        tags.className = 'filter-tags-wrap';
        tags.style.display = "flex";
        tags.style.gap = "0.8vh";

        const categories = [
            { id: 'all', label: 'Все' },
            { id: 'vip', label: 'VIP' },
            { id: 'mobile', label: 'Mobile' },
            { id: 'officials', label: 'Госники' },
        ];

        categories.forEach(cat => {
            tags.appendChild(createTagButton(cat.id, cat.label, cat.id));
        });

        row2.appendChild(label2);
        row2.appendChild(tags);
        panel.appendChild(row2);
        content.insertBefore(panel, table);
        if (document.getElementById('filter-min-lvl')) document.getElementById('filter-min-lvl').value = savedFilters.minLvl ?? '';
        if (document.getElementById('filter-max-lvl')) document.getElementById('filter-max-lvl').value = savedFilters.maxLvl ?? '';
        if (document.getElementById('filter-min-ping')) document.getElementById('filter-min-ping').value = savedFilters.minPing ?? '';
        if (document.getElementById('filter-max-ping')) document.getElementById('filter-max-ping').value = savedFilters.maxPing ?? '';        
        if (savedFilters.activeTag) activeTag = savedFilters.activeTag;
        InterfaceManager.executeFunctionWhen(() => {
            updateTagButtons();
            updateUI()
        }, () => !!document.getElementById('filter-tag-all'));
    }
    updatePanelVisibility();
};

const updatePanelVisibility = () => {
    const panel = document.getElementById('players-online-inline-filters');
    if (panel) panel.style.display = isPanelOpen ? 'flex' : 'none';
    InterfaceManager.executeFunctionWhen(updateUI, () => !!document.getElementById('players-online-filter-toggle'));
};

const updateUI = () => {
    updateTagButtons();
    const minLvl = document.getElementById('filter-min-lvl') ?.value || '';
    const maxLvl = document.getElementById('filter-max-lvl') ?.value || '';
    const minPing = document.getElementById('filter-min-ping') ?.value || '';
    const maxPing = document.getElementById('filter-max-ping') ?.value || '';
    const hasFilters = (activeTag !== 'all') || minLvl !== '' || maxLvl !== '' || minPing !== '' || maxPing !== '';
    const dot = document.querySelector('#players-online-filter-toggle .toggle-dot');
    if (dot) dot.style.display = hasFilters ? 'inline' : 'none';
};

export const filtersTab = () => {
    if (!filtersInstance) filtersInstance = new FiltersManager();
    InterfaceManager.registerInterfaceListener('PlayersOnline', () => {
        if (!info.auth) return;
        InterfaceManager.executeFunctionWhen(Filters, () => !!document.querySelector('.players-online__content__header'));
        recalculate();
    });
    return {
        name: 'FiltersTab',
        filters: filtersInstance,
        destroy: () => {
            document.getElementById('players-online-filter-toggle') ?.remove();
            document.getElementById('players-online-inline-filters') ?.remove();
        }
    };
};

export default filtersTab;