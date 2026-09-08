import { info } from '../config/state';
import { InterfaceManager } from '../core/InterfaceManager';

export function AutoSP() {
InterfaceManager.registerInterfChat((args) => {
    if (!info || !info.auth) return;
    const reportMatch = /\[WARN #\d+\][\s\S]*?\[(\d+)\]\s*(?:\{[^}]*\}\s*)?\(/.exec(args[0]);
    if (reportMatch) {
        const player = Array.from(info.players.values()).find(p => p.id == reportMatch[1]);
        const lvl = player ? player.score : null;
        const iconid = info.icons.find(icon => icon.title === "sp").id;
        const button = (iconid !== undefined && iconid !== null) ? ` {btn:${iconid}:1001:${reportMatch[1]}}` : '';
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
