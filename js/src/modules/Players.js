import { info } from '../config/state';
import { InterfaceManager } from '../core/InterfaceManager';

function checkPlayerFilters(player) {
    const filters = info.joinFilters;
    if (!filters) return;
    const len = filters.length;
    if (!len) return;
    for (let i = 0; i < len; i++) {
        const filter = filters[i];
        if (filter.enabled === false) continue;
        const raw = player[filter.param];
        if (raw === undefined || raw === null) continue;
        const a = String(raw).toLowerCase();
        const b = String(filter.value).toLowerCase();
        const op = filter.operator || filter.op;
        let isMatch = false;
        switch (op) {
            case '=':
                isMatch = (a === b);
                break;
            case '~':
                isMatch = a.includes(b);
                break;
            case '>':
                isMatch = (Number(raw) > Number(filter.value));
                break;
            case '<':
                isMatch = (Number(raw) < Number(filter.value));
                break;
            case '>=':
                isMatch = (Number(raw) >= Number(filter.value));
                break;
            case '<=':
                isMatch = (Number(raw) <= Number(filter.value));
                break;
        }
        if (isMatch) {
            const iconid = info.icons.find(icon => icon.title === "sp").id;
            const button = (iconid !== undefined && iconid !== null) ? ` {btn:${iconid}:1001:${player.id}}` : '';
            InterfaceManager.send(`Фильтр [${filter.param} ${op} ${filter.value}]: {FFCD00}${player.name}{FFFFFF} (id: ${player.id}, Клиент: ${player.mobile == 1 ? 'HASSLE' : 'RADMIR'})${button}`);
        }

    }
}
export function initPlayers() {
    let incomingIds = new Set();
    window.onUpdatePlayersList = new Proxy(window.onUpdatePlayersList, {
        apply: (target, thisArg, args) => {
            const result = Reflect.apply(target, thisArg, args);
            if (!info.auth) return result;
            const data = args[0];
            const local = data.local;
            info.local = {
                id: local.id,
                name: local.name,
                score: local.score,
                ping: local.ping,
            };

            incomingIds.clear();
            const players = data.players;
            const cache = info.players;
            for (let i = 0; i < players.length; i++) {
                const newPlayer = players[i];
                incomingIds.add(newPlayer.id);
                const cachedPlayer = cache.get(newPlayer.id);
                if (cachedPlayer) {
                    if (!info.isPlayersFirstUpdate && local.score > 0) {
                        if (cachedPlayer.score < 1 && newPlayer.score >= 1) checkPlayerFilters(newPlayer);
                    }
                    const isSamePlayer = newPlayer.score !== 0 && (cachedPlayer.score === newPlayer.score || cachedPlayer.score === newPlayer.score - 1);
                    if (isSamePlayer) {
                        if (cachedPlayer.name !== newPlayer.name) {
                            const oldName = cachedPlayer.name;
                            const newName = String(newPlayer.name);
                            if (oldName.startsWith("Mask_")) {
                                cachedPlayer.name = newName;
                                cachedPlayer.fakeName = "";
                            } else if (newName.startsWith("Mask_")) {
                                cachedPlayer.fakeName = oldName;
                                cachedPlayer.name = newName;
                            } else if (cachedPlayer.fakeName !== newName) {
                                cachedPlayer.fakeName = oldName;
                                cachedPlayer.name = newName;
                            }
                        }
                        cachedPlayer.ping = newPlayer.ping;
                        cachedPlayer.score = newPlayer.score;

                    } else {
                        const playerObj = {...newPlayer, fakeName: "" };
                        cache.set(newPlayer.id, playerObj);
                    }
                } else {
                    const playerObj = {...newPlayer, fakeName: "" };
                    cache.set(newPlayer.id, playerObj);
                    if (!info.isPlayersFirstUpdate && newPlayer.score >= 1) checkPlayerFilters(newPlayer);
                }
            }
            for (const [id, cached] of cache) {
                if (!incomingIds.has(id)) {
                    InterfaceManager.Events.trigger("playeroff", cached);
                    cache.delete(id);
                }
            }
            if (info.isPlayersFirstUpdate && local.score > 0) info.isPlayersFirstUpdate = false;

            return result;
        }
    });
    setInterval(() => {
        if (window.getInterfaceStatus("PlayersOnline")) return;
        window.updatePlayerList();
    }, 500);
}