import { info } from '../config/state';
import { InterfaceManager } from '../core/InterfaceManager';

export function AutoSP() {
    InterfaceManager.registerInterfChat((args) => {
        if (!info || !info.auth) return;
        const reportMatch = /^(?:\[([\d:]+)\]\s*)?(?:\{[A-Fa-f0-9]{6}\})?\s*\[WARN #(\d+)\]\s*(?:\{[A-Fa-f0-9]{6}\})?\s*Подозрение на (.+?) от ([^\s]+)\[(\d+)\]\s*(?:\{[A-Fa-f0-9]{6}\})?\s*\((.+?)\)/.exec(args[0]);
        if (reportMatch) {
            const player = Array.from(info.players.values()).find(p => p.id == reportMatch[5]);
            const lvl = player ? player.score : null;
            const spIcon = info.icons.find(icon => icon.title === "sp");
            const iconid = spIcon ? spIcon.id : null;
            const button = (iconid !== undefined && iconid !== null) ? ` {btn:${iconid}:1001:${reportMatch[5]}}` : '';
            args[0] += (lvl !== null ? `, Score: ${lvl}` : '') + button;
            return;
        }
    });
    document.addEventListener('click', (e) => {
        if (!info.auth) return
        if (e.target.closest('.players-online__content__table__players__player__item__copy')) return;
        const row = e.target.closest('.players-online__content__table__players__player');
        const id = row.querySelector('.players-online__content__table__players__player__item_id');
        window.sendChatInput(`/sp ${id.textContent.trim()}`)
    }, true);
}