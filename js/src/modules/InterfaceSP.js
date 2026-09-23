import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';

export const InterfaceSP = {
    name: 'InterfaceSP',
    data: {},
    boundKeydown: null,
    init() {
        InterfaceManager.registerInterfaceListener("AdminSpectate", () => {
            if (!this.data.enabled) return;
            [".admin-bottom__tabs.admin-panel", ".admin-menu.admin-panel", ".button"].forEach(selector => {
                InterfaceManager.executeFunctionWhen(() => {
                    window.interface("Hud").voiceChat.show = true;
                    document.removeEventListener("keyup", window.interface("AdminSpectate").onKeyUp);
                    document.querySelectorAll(selector).forEach(el => el.remove());
                }, () => document.querySelector(selector));
            });
            this.boundKeydown = this.keydown.bind(this);
            document.addEventListener('keydown', this.boundKeydown);

            const container = document.createElement("div");
            container.id = "spectate-tools";
            container.style.position = "fixed";
            container.style.bottom = "3vh";
            container.style.left = "50%";
            container.style.transform = "translateX(-50%)";
            container.style.width = "340px";
            container.style.background = "linear-gradient(246deg,#49494966,#27272766)";
            container.style.backdropFilter = "blur(6px)";
            container.style.borderRadius = "10px";
            container.style.fontFamily = "Open Sans";
            container.style.color = "#fff";
            container.style.zIndex = "10000";
            container.style.overflow = "hidden";
            container.style.border = "1px solid rgba(255,255,255,0.1)";
            container.style.display = "flex";
            container.style.flexDirection = "column";

            const topLine = document.createElement("div");
            topLine.style.height = "5px";
            topLine.style.background = "#ffb200";
            container.appendChild(topLine);

            const title = document.createElement("div");
            title.style.textAlign = "center";
            title.style.padding = "4px";
            container.appendChild(title);

            const body = document.createElement("div");
            body.style.display = "flex";
            body.style.flexDirection = "column";
            body.style.padding = "6px";
            container.appendChild(body);

            const visibleButtons = info.spButtons.filter(b => !b.disabled);
            const chunkSize = 8;
            const rows = [];
            for (let i = 0; i < visibleButtons.length; i += chunkSize) {
                rows.push(visibleButtons.slice(i, i + chunkSize));
            }
            if (rows.length > 1 && rows[rows.length - 1].length < chunkSize) {
                const last = rows.pop();
                rows[rows.length - 1].push(...last);
            }
            rows.forEach((chunk, i) => {
                body.appendChild(this.createRow(chunk));
            });
            document.body.appendChild(container);
            InterfaceManager.executeFunctionWhen(() => {
                const nick = document.querySelector(".admin-bottom__data .data .data-name");
                nick.style.fontSize = "16px";
                nick.style.fontWeight = "600";
                nick.style.display = "flex";
                nick.style.alignItems = "center";
                nick.style.justifyContent = "center";
                nick.style.width = "fit-content";
                nick.style.margin = "0 auto";

                const idEl = nick.querySelector(".id");
                idEl.insertAdjacentHTML("beforebegin", '<span style="margin-left:4px">[</span>');
                idEl.insertAdjacentHTML("afterend", "<span>]</span>");
                idEl.dataset.wrapped = "1";
                title.appendChild(nick);
            }, () => document.querySelector(".admin-bottom__data .data .data-name"));
            InterfaceManager.executeFunctionWhen(() => {
                const date = document.querySelector(".data-date");
                date.style.fontSize = "11px";
                date.style.opacity = "0.8";
                title.appendChild(date);
            }, () => document.querySelector(".data-date"));
        });

        InterfaceManager.registerInterfaceclose("AdminSpectate", () => {
            const container = document.getElementById("spectate-tools");
            if (container) container.remove();
            if (this.boundKeydown) document.removeEventListener('keydown', this.boundKeydown);
        });
    },

    keydown(e) {
        if (e.keyCode === 37) {
            window.sendClientEvent(0, "OnChangeSpectatePlayer", 0, 0);
        }
        if (e.keyCode === 39) {
            window.sendClientEvent(0, "OnChangeSpectatePlayer", 1, 0);
        }
        if (e.keyCode === 16) {
            window.sendClientEvent(0, "OnSelectSpectateMenu", 0);
        }
    },

    createRow(list) {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.flexWrap = "wrap";
        row.style.justifyContent = "center";
        list.forEach((btnData, index) => {
            const btn = document.createElement("div");
            btn.textContent = btnData.text;
            btn.style.padding = "4px 11px";
            btn.style.fontSize = "11px";
            btn.style.background = "rgba(255,255,255,0.12)";
            btn.style.borderRadius = "6px";
            btn.style.transition = "0.2s";
            btn.style.color = "#fff";

            if (index < list.length - 1) {
                btn.style.marginRight = "4px";
            }
            btn.style.marginBottom = "4px";

            btn.onmouseenter = () => {
                btn.style.background = "#ffb200";
                btn.style.color = "#2b1a05";
            };
            btn.onmouseleave = () => {
                btn.style.background = "rgba(255,255,255,0.12)";
                btn.style.color = "#fff";
            };

            btn.onclick = btnData.action;
            row.appendChild(btn);
        });
        return row;
    },

    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    }
};