import { InterfaceManager } from './InterfaceManager';
import { ApiService } from '../services/ApiService';
import { info } from '../config/state';
import { scripts, Rest } from '../modules/index';

export const load = {
    start() {
        InterfaceManager.registerInterfaceListener("Loading", () => {
            this.isActivated = false;
            this.unload();
            if (window.getInterfaceStatus("AdminSpectate")) window.closeInterface("AdminSpectate")
        });
        InterfaceManager.registerInterfaceListener("Authorization", (args) => {
            const obj = JSON.parse(args[1]);
            const name = obj[1];
            const serverId = obj[2];
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "accounts.json", true);
            xhr.onload = () => {
                if (xhr.status !== 200 || !xhr.responseText) return;
                const accounts = JSON.parse(xhr.responseText);
                const match = accounts.find(a => a.name === name && a.serverId === serverId);
                if (match && match.pass) {
                    InterfaceManager.createDialog(0, "AutoLogin", "", "Да", "Нет", "Автоматический вход для " + name, () => {
                        window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnAuthorizationStart", match.pass);
                    });
                }
            };
            xhr.send();
        });
        InterfaceManager.registerInterfChat((args) => {
            if (args[0].includes('Подключились. Присоединение к игре...')) {
                info.isPlayersFirstUpdate = true;
                info.auth = false;
            }
        });
        if (window.App.$store.getters["player/isPlayerConnected"] && !this.isActivated) this.initTools();
        window.setPlayerConnectedStatus = new Proxy(window.setPlayerConnectedStatus, {
            apply: (target, thisArg, args) => {
                if (args[0] === 1) this.initTools();
                return Reflect.apply(target, thisArg, args);
            }
        });

    },
    async initTools() {
        if (info.isActivated) return;
        this.isActivated = true;
        info.local = { id: -1, name: "", score: 0, ping: 0 };
        info.nick = window.App.$store.getters["player/nickName"];
        info.server = window.App.$store.getters["player/serverId"];
        if (info.hostIndex === undefined) {
            const host = await ApiService.getHost();
            if (!host) return InterfaceManager.createDialog(0, "", "Не удалось найти рабочий хост", "Ок", "", "");
        }
        const auth = await ApiService.auth();
        if (!auth.success) return InterfaceManager.createDialog(0, "", "Ошибка авторизации", "Ок", "", "");
        info.auth = true;
        Object.assign(info, {
            disabled: auth.data.admin.disabled,
            aspawn: auth.data.admin.aspawn,
            minHp: auth.data.admin.min_hp,
            copy: auth.data.admin.copy,
            alistThresholdDays: auth.data.admin.alist_threshold_days,
            joinFilters: auth.data.admin.join_filters,
            keybindTP: auth.data.admin.keybind_tp,
            keybindSpecTP: auth.data.admin.keybind_spectp
        });
        info.spButtons.forEach(btn => {
            btn.disabled = auth.data.admin.sp_buttons_disabled.includes(btn.id);
        });
        if (auth.data.admin.abind_group) {
            const { batchSize, delay, order } = auth.data.admin.abind_group;
            if (typeof batchSize === "number") info.abindGroup.batchSize = batchSize;
            if (typeof delay === "number") info.abindGroup.delay = delay;
            if (Array.isArray(order)) {
                info.abindGroup.order = order.map(({ id, label, aliases, enabled, checkOnline }) => ({
                    id,
                    label,
                    aliases,
                    enabled,
                    checkOnline
                }));
            }
        }
        if (!info.aspawnrecovery && info.aspawn.x && info.aspawn.y && info.aspawn.z) window.sendChatInput(`/pos ${info.aspawn.x},${info.aspawn.y},${info.aspawn.z},${info.aspawn.interior}`);
        info.aspawnrecovery = false;
        this.load();
        if (auth.data.admin.version !== info.version) return InterfaceManager.createDialog(0, "Обновление", "", "Ок", "", `У вас устаревшая версия (${info.version}). Актуальная версия: ${auth.data.admin.version}. Вы можете скачать обновление: {https://github.com/kramerforster/Nion-Tools|Скачать обновление|#38afec}`)
    },
    load() {
        if (!info.i) {
            info.i = true;
            Rest();
            Object.values(scripts).forEach(script => script.init());
        }
        Object.entries(scripts).forEach(([name, script]) => {
            script.toggle(!info.disabled.includes(name));
        });
    },
    unload() {
        Object.values(scripts).forEach(script => script.toggle(false));
    }
};