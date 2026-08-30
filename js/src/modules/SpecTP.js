import { info } from '../config/state';
import { functions } from './functions';
import { InterfaceManager } from '../core/InterfaceManager';

export const SpecTP = {
    name: 'SpecTP',
    data: {
        pressed: {},
    },
    init() {
        document.addEventListener('keydown', async(e) => {
            if (!this.data.enabled) return;
            this.data.pressed[e.code] = true;
            if (info.keybindSpecTP.includes(e.code) && info.keybindSpecTP.every(c => this.data.pressed[c])) {
                if (!window.getInterfaceStatus("AdminSpectate")) return;
                let sid = window.interface("AdminSpectate").player.id
                const tp = await functions.goto(sid);
                if (!tp) return InterfaceManager.send("Функция goto не дождалась ответа");
                window.sendChatInput("/fly");
                window.interface("Hud").$refs.chat.inputHint(`/tpcar ${sid}`)
            }
        });
        document.addEventListener('keyup', (e) => {
            delete this.data.pressed[e.code];
        });
    },
    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    }
};