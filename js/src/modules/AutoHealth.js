import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';

export const AutoHealth = {
    name: 'AutoHealth',
    data: {
        queue: [],
        isProcessing: false,
        lastAction: null,
    },
    init() {
        window.interface = new Proxy(window.interface, {
            apply(target, thisArg, args) {
                const result = target.apply(thisArg, args);
                if (args[0] !== "Hud") return result;
                if (AutoHealth.data.enabled && typeof result === "object" && result !== null) {
                    return new Proxy(result, {
                        get(t, prop) {
                            if (prop === "info") {
                                return new Proxy(t[prop], {
                                    set(hpTarget, hpProp, value) {
                                        if (hpProp === "health" && info.local && info.local.id !== -1) {
                                            if (value <= info.minHp) {
                                                if (!window.getInterfaceStatus("AdminSpectate") && !window.getInterfaceStatus("Death")) AutoHealth.ProcessQueue('hp');
                                            }
                                        }
                                        return Reflect.set(hpTarget, hpProp, value);
                                    }
                                });
                            }
                            return t[prop];
                        }
                    });
                }
                return result;
            }
        });
        InterfaceManager.registerInterfaceListener("Death", () => {
            if (!this.data.enabled) return;
            if (info.local && info.local.id !== -1) {
                this.ProcessQueue('eps');
                this.ProcessQueue('hp');
            }
        });
        InterfaceManager.registerInterfChat((args) => {
            if (!this.data.enabled) return;
            if (args[0].includes("Не флудите")) {
                if (this.data.lastAction && !this.data.queue.includes(this.data.lastAction)) this.data.queue.unshift(this.data.lastAction);
            }
        });
    },
    ProcessQueue(action) {
        if (action) {
            if (!this.data.queue.includes(action)) this.data.queue.push(action);
        }
        if (this.data.isProcessing || this.data.queue.length === 0) return;
        this.data.isProcessing = true;
        action = this.data.queue.shift();
        this.data.lastAction = action;
        if (action === 'eps' || !window.getInterfaceStatus("AdminSpectate")) window.sendChatInput(action === 'hp' ? `/hp ${info.local.id} 100` : `/end_premortem_state ${info.local.id}`);
        setTimeout(() => {
            this.data.isProcessing = false;
            this.ProcessQueue();
        }, 2000);
    },
    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    }
};