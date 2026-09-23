import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';


export const AutoHealth = {
    name: 'AutoHealth',
    data: {
        queue: [],
        isProcessing: false,
        lastAction: null,
        currentCooldown: 500,
        timerId: null,
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
                                        if (hpProp === "health" && info.local.id !== -1) {
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
            if (info.local.id !== -1) {
                this.ProcessQueue('eps');
                this.ProcessQueue('hp');
            }
        });

        InterfaceManager.registerInterfChat((args) => {
            if (!this.data.enabled) return;
            if (args[0].includes("Не флудите")) {
                this.data.currentCooldown = 2000;
                if (this.data.lastAction && this.data.isProcessing) {
                    const actionToReturn = this.data.lastAction;
                    if (!this.data.queue.includes(actionToReturn)) {
                        this.data.queue.unshift(actionToReturn);
                    }
                }
                this.data.lastAction = null;
                if (this.data.isProcessing && this.data.timerId) {
                    clearTimeout(this.data.timerId);
                    this.data.timerId = setTimeout(() => {
                        this.data.isProcessing = false;
                        this.data.currentCooldown = 500;
                        this.ProcessQueue();
                    }, this.data.currentCooldown);
                }
            }
        });
    },

    ProcessQueue(action) {
        if (action) {
            if (!this.data.queue.includes(action)) this.data.queue.push(action);
        }
        if (this.data.isProcessing || this.data.queue.length === 0) return;
        this.data.isProcessing = true;
        const currentAction = this.data.queue.shift();
        this.data.lastAction = currentAction;
        if (currentAction === 'hp') {
            if (!window.getInterfaceStatus("AdminSpectate")) window.sendChatInput(`/hp ${info.local.id} 100`);
        } else if (currentAction === 'eps') window.sendChatInput(`/end_premortem_state ${info.local.id}`);
        this.data.timerId = setTimeout(() => {
            this.data.lastAction = null;
            this.data.isProcessing = false;
            this.data.currentCooldown = 500;
            this.ProcessQueue();
        }, this.data.currentCooldown);
    },

    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
        if (!this.data.enabled) {
            if (this.data.timerId) clearTimeout(this.data.timerId);
            this.data.queue = [];
            this.data.isProcessing = false;
            this.data.lastAction = null;
            this.data.currentCooldown = 500;
            this.data.timerId = null;
        }
    }
};