import { info } from '../config/state';

export const Copy = {
    name: 'Copy',
    data: {},
    patterns: [{
            regex: /\[(A|HASSLE|RADMIR)\]\s+(.+)\[(\d+)\]:\s+(.+)/,
            get: m => m[4].trim()
        },
        {
            regex: /Игрок\s+(.+)\[\d+\]\s+за которым вы наблюдали покинул игру/,
            get: m => m[1].trim()
        },
        {
            regex: /(?:Администратор|Агент поддержки)\s+(.+?)\[\d+\]\s+для\s+(.+?)\[\d+\]:\s+(.+?)\s*(?:\{btn:\d+:\d+:\d+\})?$/,
            get: m => m[3].trim()
        }
    ],
    init() {
        const container = window.interface("Hud").$refs.chat.$el.querySelector(".radmir-chat__messages");
        if (!container) return;
        container.addEventListener("click", (e) => {
            if (!this.data.enabled) return;
            if (e.target.closest(".chat-message-content__action")) return;
            const content = e.target.closest(".chat-message-content");
            if (!content) return;
            const message = content.textContent.trim();
            let copyText = "";
            if (info.copy === false) {
                const matches = message.match(/\b[A-Za-z0-9]+_[A-Za-z0-9]+\b/g);
                copyText = matches ? matches.join(" ") : message;
            } else if (Array.isArray(this.patterns)) {
                for (let i = 0; i < this.patterns.length; i++) {
                    const match = message.match(this.patterns[i].regex);
                    if (match) {
                        copyText = this.patterns[i].get(match);
                        break;
                    }
                }
            }
            if (!copyText) copyText = message;
            window.interface("GameText").add(JSON.stringify([1, copyText, 3000, 0, -1, 1, 0, 1.2]));
            window.setClipboardText(copyText);

        });
    },
    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    }
};