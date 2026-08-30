import { info } from '../config/state';

export function AutoSP() {
    document.addEventListener('click', (e) => {
    if (!info.auth) return
    if (e.target.closest('.players-online__content__table__players__player__item__copy')) return;
    const row = e.target.closest('.players-online__content__table__players__player');
    const id = row.querySelector('.players-online__content__table__players__player__item_id');
    window.sendChatInput(`/sp ${id.textContent.trim()}`)
}, true);
}