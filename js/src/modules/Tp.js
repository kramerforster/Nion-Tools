import { info } from '../config/state';

export const Tp = {
    name: 'Tp',
    data: {
        coords: "0,0,0,0",
        pressed: {},
    },
    init() {
        engine.on("NavigationPathUpdated", (data) => {
            if (this.data.enabled) {
                const points = JSON.parse(data);
                if (points.length) this.data.coords = points[points.length - 1].join(",") + ",0";
            }
        });
        document.addEventListener('keydown', (e) => {
            if (!this.data.enabled) return;
            this.data.pressed[e.code] = true;

            if (info.keybindTP.includes(e.code) && info.keybindTP.every(c => this.data.pressed[c])) {
                if (window.getInterfaceStatus("AdminSpectate")) return InterfaceManager.send("Телепортация в режиме наблюдателя недоступна.");
                window.sendChatInput("/" + (window.interface("Hud").speedometer.show ? "vehpos" : "pos") + " " + this.data.coords);
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