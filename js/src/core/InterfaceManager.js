import { info } from '../config/state';

export const InterfaceManager = {
    listeners: {
        interfaces: [],
        interfacesc: [],
        commands: [],
        dialogs: [],
        chat: []
    },
    dialogIndex: undefined,
    originals: {
        sendClientEvent: null,
        addDialogInQueue: null
    },
    Events: {
        events: {},
        on(event, cb) {
            (this.events[event] = this.events[event] || []).push(cb);
        },
        trigger(event, ...args) {
            this.events[event] ?.forEach(cb => cb(...args));
        }
    },
    executeFunctionWhen(callback, condition) {
        const interval = setInterval(() => {
            if (condition()) {
                callback();
                clearInterval(interval);
            }
        }, 32);
    },
    registerInterfChat(callback) {
        const listener = { callback };
        this.listeners.chat.push(listener);
        return () => {
            const index = this.listeners.chat.indexOf(listener);
            if (index > -1) this.listeners.chat.splice(index, 1);
        };
    },
    registerInterfaceListener(forInterface, callBack, notShow = () => false) {
        const listener = { forInterface, callBack, notShow };
        this.listeners.interfaces.push(listener);
        return () => {
            const index = this.listeners.interfaces.indexOf(listener);
            if (index > -1) this.listeners.interfaces.splice(index, 1);
        };
    },
    registerDialog(forDialog, callBack, notShow = () => false) {
        const listener = { forDialog, callBack, notShow };
        this.listeners.dialogs.push(listener);
        return () => {
            const index = this.listeners.dialogs.indexOf(listener);
            if (index > -1) this.listeners.dialogs.splice(index, 1);
        };
    },
    createKeybindPicker(onSave = () => {}, onCancel = () => {}, initialKeys = []) {
        if (document.getElementById('keyboard')) return;
        window.setCursorStatus("keyboard", true);

        const applyKeyBaseStyle = (el) => {
            el.style.boxSizing = "border-box";
            el.style.border = "0.14vh solid rgba(255, 255, 255, 0.1)";
            el.style.borderBottomColor = "rgba(255, 255, 255, 0.15)";
            el.style.borderRadius = "0.37vh";
            el.style.fontSize = "1.02vh";
            el.style.fontWeight = "600";
            el.style.display = "flex";
            el.style.alignItems = "center";
            el.style.justifyContent = "center";
            el.style.userSelect = "none";
            el.style.transition = "all 0.15s ease";
            el.style.cursor = "pointer";
            el.style.background = "rgba(255, 255, 255, 0.05)";
            el.style.color = "#b0b0b0";
            el.style.boxShadow = "inset 0 0.74vh 1.11vh 0 rgba(255, 255, 255, 0.03)";
            el.style.transform = "none";
            el.style.opacity = "1";
        };

        const savedCodes = new Set(initialKeys);
        const pressed = new Set();

        const updateKeyStyle = (el) => {
            const code = el.dataset.code;
            const isSelected = savedCodes.has(code);
            const isActive = el.dataset.active === 'true';
            applyKeyBaseStyle(el);
            if (isSelected) {
                el.style.background = "rgba(249, 183, 1, 0.15)";
                el.style.borderColor = "#f9b701";
                el.style.color = "#f9b701";
                el.style.boxShadow = "inset 0 0.74vh 1.11vh 0 rgba(249, 183, 1, 0.1)";
                el.style.opacity = "0.85";
            }
            if (isActive) {
                el.style.background = "#f4f1e1";
                el.style.borderColor = "rgba(244, 241, 225, 0.4)";
                el.style.color = "#141414";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0.09vh)";
                el.style.opacity = "1";
            }
        };

        const makeKey = (code, label, width) => {
            const el = document.createElement('div');
            el.className = 'nion-kb-key';
            el.dataset.code = code;
            el.textContent = label;

            applyKeyBaseStyle(el);
            el.style.setProperty('height', '3.7vh', 'important');
            el.style.setProperty('flex', '0 0 auto', 'important');

            if (width === 'space') {
                el.style.setProperty('flex', '1 0 auto', 'important');
            } else if (width) {
                el.style.setProperty('width', width, 'important');
            } else {
                el.style.setProperty('width', '3.7vh', 'important');
            }
            return el;
        };

        const makeRow = () => {
            const row = document.createElement('div');
            row.style.display = "flex";
            row.style.flexDirection = "row";
            row.style.gap = '0.46vh';
            row.style.width = "100%";
            row.style.boxSizing = "border-box";
            row.style.flex = "0 0 auto";
            return row;
        };

        const makeGap = () => {
            const g = document.createElement('div');
            g.style.width = "1.11vh";
            g.style.flex = "0 0 auto";
            return g;
        };

        const makeInvisible = () => {
            const el = document.createElement('div');
            el.style.height = '3.7vh';
            el.style.width = '3.7vh';
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
            el.style.flex = "0 0 auto";
            return el;
        };

        const applyBlockStyle = (block) => {
            block.style.display = "flex";
            block.style.flexDirection = "column";
            block.style.gap = '0.46vh';
            block.style.flex = "0 0 auto";
            block.style.width = "auto";
            block.style.minWidth = "max-content";
        };

        const overlay = document.createElement('div');
        overlay.id = 'keyboard';
        overlay.style.position = "fixed";
        overlay.style.inset = "0";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.zIndex = "99999999";
        overlay.style.background = "rgba(0, 0, 0, 0.75)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.boxSizing = "border-box";
        overlay.style.fontFamily = "'Open Sans', sans-serif";

        const container = document.createElement('div');
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.gap = "1.48vh";
        container.style.width = "max-content";
        container.style.minWidth = "max-content";
        container.style.height = "auto";
        container.style.boxSizing = "border-box";
        container.style.margin = "auto";
        container.style.flexShrink = "0";

        const keyboard = document.createElement('div');
        keyboard.style.display = "flex";
        keyboard.style.gap = "1.39vh";
        keyboard.style.background = "rgba(20, 20, 20, 0.98)";
        keyboard.style.border = "0.14vh solid rgba(255, 255, 255, 0.1)";
        keyboard.style.borderRadius = "0.74vh";
        keyboard.style.padding = "1.48vh";
        keyboard.style.boxShadow = "0 0.93vh 3.7vh rgba(0, 0, 0, 0.8)";
        keyboard.style.boxSizing = "border-box";
        keyboard.style.alignItems = "flex-start";
        keyboard.style.width = "max-content";
        keyboard.style.minWidth = "max-content";
        keyboard.style.flexShrink = "0";

        const mainBlock = document.createElement('div');
        applyBlockStyle(mainBlock);

        const navBlock = document.createElement('div');
        applyBlockStyle(navBlock);
        navBlock.style.setProperty('margin-left', '0.93vh', 'important');

        const mainRows = [
            [
                ['Escape', 'Esc', '3.7vh'], 'gap', ['F1', 'F1'],
                ['F2', 'F2'],
                ['F3', 'F3'],
                ['F4', 'F4'], 'gap', ['F5', 'F5'],
                ['F6', 'F6'],
                ['F7', 'F7'],
                ['F8', 'F8'], 'gap', ['F9', 'F9'],
                ['F10', 'F10'],
                ['F11', 'F11'],
                ['F12', 'F12']
            ],
            [
                ['Backquote', '`'],
                ['Digit1', '1'],
                ['Digit2', '2'],
                ['Digit3', '3'],
                ['Digit4', '4'],
                ['Digit5', '5'],
                ['Digit6', '6'],
                ['Digit7', '7'],
                ['Digit8', '8'],
                ['Digit9', '9'],
                ['Digit0', '0'],
                ['Minus', '-'],
                ['Equals', '='],
                ['Backspace', 'Backspace', '7.86vh']
            ],
            [
                ['Tab', 'Tab', '5.5vh'],
                ['KeyQ', 'Q'],
                ['KeyW', 'W'],
                ['KeyE', 'E'],
                ['KeyR', 'R'],
                ['KeyT', 'T'],
                ['KeyY', 'Y'],
                ['KeyU', 'U'],
                ['KeyI', 'I'],
                ['KeyO', 'O'],
                ['KeyP', 'P'],
                ['BracketLeft', '['],
                ['BracketRight', ']'],
                ['Backslash', '\\', '5.5vh']
            ],
            [
                ['CapsLock', 'Caps', '6.5vh'],
                ['KeyA', 'A'],
                ['KeyS', 'S'],
                ['KeyD', 'D'],
                ['KeyF', 'F'],
                ['KeyG', 'G'],
                ['KeyH', 'H'],
                ['KeyJ', 'J'],
                ['KeyK', 'K'],
                ['KeyL', 'L'],
                ['SemiColon', ';'],
                ['Quote', "'"],
                ['Enter', 'Enter', '8.1vh']
            ],
            [
                ['ShiftLeft', 'Shift', '8.5vh'],
                ['KeyZ', 'Z'],
                ['KeyX', 'X'],
                ['KeyC', 'C'],
                ['KeyV', 'V'],
                ['KeyB', 'B'],
                ['KeyN', 'N'],
                ['KeyM', 'M'],
                ['Comma', ','],
                ['Period', '.'],
                ['Slash', '/'],
                ['ShiftRight', 'Shift', '10.2vh']
            ],
            [
                ['ControlLeft', 'Ctrl', '5.0vh'],
                ['MetaLeft', 'Win', '4.5vh'],
                ['AltLeft', 'Alt', '4.5vh'],
                ['Space', 'Space', 'space'],
                ['AltRight', 'Alt', '4.5vh'],
                ['ContextMenu', 'Menu', '4.5vh'],
                ['ControlRight', 'Ctrl', '5.0vh']
            ]
        ];

        const keyElements = {};

        mainRows.forEach(rowDef => {
            const row = makeRow();
            rowDef.forEach(item => {
                if (item === 'gap') {
                    row.appendChild(makeGap());
                    return;
                }
                const [code, label, width] = item;
                const el = makeKey(code, label, width);
                keyElements[code] = el;
                row.appendChild(el);
            });
            mainBlock.appendChild(row);
        });

        const navRows = [
            [
                ['PrintScreen', 'PrtSc'],
                ['ScrollLock', 'ScrLk'],
                ['Pause', 'Pause']
            ],
            [
                ['Insert', 'Ins'],
                ['Home', 'Home'],
                ['PageUp', 'PgUp']
            ],
            [
                ['Delete', 'Del'],
                ['End', 'End'],
                ['PageDown', 'PgDn']
            ],
            [null, null, null],
            [null, ['ArrowUp', 'Up'], null],
            [
                ['ArrowLeft', 'Left'],
                ['ArrowDown', 'Down'],
                ['ArrowRight', 'Right']
            ]
        ];

        navRows.forEach(rowDef => {
            const row = makeRow();
            rowDef.forEach(item => {
                if (item === null) {
                    row.appendChild(makeInvisible());
                    return;
                }
                const [code, label] = item;
                const el = makeKey(code, label, '3.7vh');
                keyElements[code] = el;
                row.appendChild(el);
            });
            navBlock.appendChild(row);
        });

        const numpadBlock = document.createElement('div');
        numpadBlock.style.position = "relative";
        numpadBlock.style.width = "calc(4 * 3.7vh + 3 * 0.46vh)";
        numpadBlock.style.height = "calc(5 * 3.7vh + 4 * 0.46vh)";
        numpadBlock.style.flex = "0 0 auto";
        numpadBlock.style.marginLeft = "0.93vh";

        const numpadDef = [
            { code: 'NumLock', label: 'Num', col: 0, row: 0 },
            { code: 'NumPadDivide', label: '/', col: 1, row: 0 },
            { code: 'NumPadMultiply', label: '*', col: 2, row: 0 },
            { code: 'NumPadSubtract', label: '-', col: 3, row: 0 },
            { code: 'NumPad7', label: '7', col: 0, row: 1 },
            { code: 'NumPad8', label: '8', col: 1, row: 1 },
            { code: 'NumPad9', label: '9', col: 2, row: 1 },
            { code: 'NumPadAdd', label: '+', col: 3, row: 1, rowSpan: 2 },
            { code: 'NumPad4', label: '4', col: 0, row: 2 },
            { code: 'NumPad5', label: '5', col: 1, row: 2 },
            { code: 'NumPad6', label: '6', col: 2, row: 2 },
            { code: 'NumPad1', label: '1', col: 0, row: 3 },
            { code: 'NumPad2', label: '2', col: 1, row: 3 },
            { code: 'NumPad3', label: '3', col: 2, row: 3 },
            { code: 'NumPadEnter', label: 'Ent', col: 3, row: 3, rowSpan: 2 },
            { code: 'NumPad0', label: '0', col: 0, row: 4, colSpan: 2 },
            { code: 'NumPadDecimal', label: '.', col: 2, row: 4 }
        ];

        numpadDef.forEach(({ code, label, col, row, colSpan = 1, rowSpan = 1 }) => {
            const el = makeKey(code, label, null);
            el.style.setProperty('position', 'absolute', 'important');
            el.style.setProperty('left', `calc(${col} * (3.7vh + 0.46vh))`, 'important');
            el.style.setProperty('top', `calc(${row} * (3.7vh + 0.46vh))`, 'important');
            el.style.setProperty('width', `calc(${colSpan} * 3.7vh + ${colSpan - 1} * 0.46vh)`, 'important');
            el.style.setProperty('height', `calc(${rowSpan} * 3.7vh + ${rowSpan - 1} * 0.46vh)`, 'important');

            keyElements[code] = el;
            numpadBlock.appendChild(el);
        });

        keyboard.appendChild(mainBlock);
        keyboard.appendChild(navBlock);
        keyboard.appendChild(numpadBlock);

        const actions = document.createElement('div');
        actions.style.display = "flex";
        actions.style.gap = "0.74vh";
        actions.style.alignSelf = "flex-start";
        actions.style.boxSizing = "border-box";
        actions.style.flex = "0 0 auto";

        const applyCancelBtnStyle = (btn) => {
            btn.style.padding = "0.93vh 2.22vh";
            btn.style.fontSize = "1.2vh";
            btn.style.fontWeight = "600";
            btn.style.fontFamily = "'Open Sans', sans-serif";
            btn.style.border = "0.14vh solid rgba(255, 255, 255, 0.1)";
            btn.style.borderRadius = "0.37vh";
            btn.style.cursor = "pointer";
            btn.style.transition = "opacity 0.2s, transform 0.1s";
            btn.style.boxSizing = "border-box";
            btn.style.outline = "none";
            btn.style.flex = "0 0 auto";
            btn.style.background = "rgba(255, 255, 255, 0.08)";
            btn.style.color = "#f4f1e1";
            btn.style.opacity = "1";
            btn.style.transform = "none";
        };

        const applySaveBtnStyle = (btn) => {
            btn.style.padding = "0.93vh 2.22vh";
            btn.style.fontSize = "1.2vh";
            btn.style.fontWeight = "600";
            btn.style.fontFamily = "'Open Sans', sans-serif";
            btn.style.border = "none";
            btn.style.borderRadius = "0.37vh";
            btn.style.cursor = "pointer";
            btn.style.transition = "opacity 0.2s, transform 0.1s";
            btn.style.boxSizing = "border-box";
            btn.style.outline = "none";
            btn.style.flex = "0 0 auto";
            btn.style.background = "#f9b701";
            btn.style.color = "#141414";
            btn.style.opacity = "1";
            btn.style.transform = "none";
        };

        const setupButtonListeners = (btn, applyStyleFn) => {
            applyStyleFn(btn);
            btn.addEventListener('mouseenter', () => {
                btn.style.opacity = '0.9';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.opacity = '1';
            });
            btn.addEventListener('mousedown', () => {
                btn.style.transform = 'scale(0.97)';
            });
            btn.addEventListener('mouseup', () => {
                btn.style.transform = 'none';
            });
        };

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Сохранить';
        setupButtonListeners(saveBtn, applySaveBtnStyle);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Отмена';
        setupButtonListeners(cancelBtn, applyCancelBtnStyle);

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);

        container.appendChild(keyboard);
        container.appendChild(actions);

        overlay.appendChild(container);
        document.body.appendChild(overlay);
        Object.values(keyElements).forEach(el => updateKeyStyle(el));

        const handleInteractionStart = (code) => {
            const el = keyElements[code];
            if (!el) return;
            pressed.add(code);
            el.dataset.active = 'true';

            if (savedCodes.has(code)) {
                savedCodes.delete(code);
            } else {
                if (savedCodes.size >= 2) {
                    const oldest = savedCodes.values().next().value;
                    savedCodes.delete(oldest);
                    const oldestEl = keyElements[oldest];
                    if (oldestEl) updateKeyStyle(oldestEl);
                }
                savedCodes.add(code);
            }
            updateKeyStyle(el);
        };

        const handleInteractionEnd = (code) => {
            const el = keyElements[code];
            if (!el) return;

            pressed.delete(code);
            el.removeAttribute('data-active');
            updateKeyStyle(el);
        };

        Object.entries(keyElements).forEach(([code, el]) => {
            el.addEventListener('mouseleave', () => {
                if (pressed.has(code)) {
                    handleInteractionEnd(code);
                }
            });

            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                handleInteractionStart(code);
            });

            el.addEventListener('mouseup', (e) => {
                e.preventDefault();
                handleInteractionEnd(code);
            });

            el.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleInteractionStart(code);
            }, { passive: false });

            el.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleInteractionEnd(code);
            }, { passive: false });
        });

        const keydownHandler = (e) => {
            if (keyElements[e.code]) {
                e.preventDefault();
                e.stopPropagation();
                handleInteractionStart(e.code);
            }
        };

        const keyupHandler = (e) => {
            if (pressed.has(e.code)) {
                e.preventDefault();
                e.stopPropagation();
                handleInteractionEnd(e.code);
            }
        };

        document.addEventListener('keydown', keydownHandler, true);
        document.addEventListener('keyup', keyupHandler, true);

        const cleanup = () => {
            document.removeEventListener('keydown', keydownHandler, true);
            document.removeEventListener('keyup', keyupHandler, true);
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            window.setCursorStatus("keyboard", false);
        };

        saveBtn.onclick = (e) => {
            e.stopPropagation();
            cleanup();
            onSave([...savedCodes]);
        };

        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            cleanup();
            onCancel();
        };

        overlay.addEventListener('mousedown', (e) => {
            if (e.target === overlay) {
                cleanup();
                onCancel();
            }
        });
    },
    registerInterfaceclose(forInterface, callback) {
        const listener = { forInterface, callback };
        this.listeners.interfacesc.push(listener);
        return () => {
            const index = this.listeners.interfacesc.indexOf(listener);
            if (index > -1) this.listeners.interfacesc.splice(index, 1);
        };
    },
    registerCommand(name, callback, hide = true) {
        const listener = { name, callback, hide };
        this.listeners.commands.push(listener);
        return () => {
            const index = this.listeners.commands.indexOf(listener);
            if (index > -1) this.listeners.commands.splice(index, 1);
        };
    },
    closeDialog() {
        window.sendClientEvent(0, "OnDialogResponse", 0, 1, -1, "");
        window.closeLastDialog();
    },
    send(text) {
        window.onChatMessage("[Nion Tools] {FFFFFF}" + text, "ff6421f2")
    },
    parseCopyTags(val) {
        if (Array.isArray(val)) return val.map(v => this.parseCopyTags(v));
        return typeof val === 'string' ? val.replace(/\{copy:([^\|\}]+)\}/g, '{copy:$1|$1|3b82f6}') : val;
    },
    createDialog(e = 0, t = "Title", i = "Subtitle", s = "Выбрать", n = "Закрыть", o = "Text", a = () => {}, l = () => {}) {
        if (window.addDialogInQueue) this.closeDialog();
        o = this.parseCopyTags(o);
        if (!this.originals.sendClientEvent) {
            this.originals.sendClientEvent = window.sendClientEvent;
            this.originals.addDialogInQueue = window.addDialogInQueue;
            window.sendClientEvent = new Proxy(window.sendClientEvent, {
                apply: (target, self, args) => {
                    if (!window.isFakeDialog) return Reflect.apply(target, self, args);

                    const isResponse = args.includes("OnDialogResponse");
                    if (isResponse || args.includes("OnMultiDialogClickNavigButton")) {
                        if (this.originals.sendClientEvent) {
                            window.sendClientEvent = this.originals.sendClientEvent;
                            this.originals.sendClientEvent = null;
                        }
                        if (this.originals.addDialogInQueue) {
                            window.addDialogInQueue = this.originals.addDialogInQueue;
                            this.originals.addDialogInQueue = null;
                        }
                        window.isFakeDialog = false;
                        if (isResponse) {
                            setTimeout(() => {
                                args[3] === 1 ? a(args[5].replace(/<[^>]*>|HLDialog/g, "")) : l();
                            }, 16);
                            this.dialogIndex = undefined;
                        } else {
                            this.dialogIndex += (args[2] === 1 ? 1 : -1);
                            setTimeout(() => this.createDialog(e, t, i, s, n, o, a, l), 64);
                        }
                        return false;
                    }
                    return Reflect.apply(target, self, args);
                }
            });
            window.addDialogInQueue = new Proxy(window.addDialogInQueue, {
                apply: (target, self, args) => {
                    window.isFakeDialog = args[1].includes("HLDialog");
                    if (window.isFakeDialog) args[1] = args[1].replace("HLDialog", "");
                    return Reflect.apply(target, self, args);
                }
            });

        }
        const isArray = Array.isArray(o);
        this.dialogIndex = isArray ? (this.dialogIndex ?? 0) : 0;
        const navButtons = isArray ? [+(this.dialogIndex > 0), +(this.dialogIndex < o.length - 1)] : [0, 0];
        window.addDialogInQueue(`[0,${e},"${t}","${i}","${s}","${n}",${navButtons[0]},${navButtons[1]}]`, "HLDialog" + (isArray ? o[this.dialogIndex] : o), 0);
    },
    init() {
        const chat = window.interface("Hud").$refs.chat;
        const originalAssign = Object.assign;
        Object.assign = (target, ...sources) => {
            const result = originalAssign.apply(this, [target, ...sources]);
            if (target && target['/src/assets/images/hud/chat/message-icons/0.svg']) {
                const ids = Object.keys(target).filter(key => key.startsWith('/src/assets/images/hud/chat/message-icons/')).map(key => parseInt(key.split('/').pop(), 10));
                info.icons.forEach(item => {
                    if (item.id === undefined) {
                        const maxId = ids.length > 0 ? Math.max(...ids) : 3;
                        item.id = maxId + 1;
                    }
                    target[`/src/assets/images/hud/chat/message-icons/${item.id}.svg`] = item.icon;
                });
            }

            return result;
        };
    if (chat.images) {
            const ids = Object.keys(chat.images).filter(key => key.startsWith('/src/assets/images/hud/chat/message-icons/')).map(key => parseInt(key.split('/').pop(), 10));
                info.icons.forEach(item => {
                    if (item.id === undefined) {
                        const maxId = ids.length > 0 ? Math.max(...ids) : 3;
                        item.id = maxId + 1;
                    }
                    chat.images[`/src/assets/images/hud/chat/message-icons/${item.id}.svg`] = item.icon;
                });
        }
        window.onChatMessageAction = new Proxy(window.onChatMessageAction, {
            apply: (target, thisArg, args) => {
                const button = info.icons.some(item => item.id !== undefined && item.id == args[0]);
                if (button && args[1] === '1001' && info.auth) {
                    window.sendChatInput(`/sp ${args[2]}`);
                    return;
                }
                return Reflect.apply(target, thisArg, args);
            }
        });
        window.closeInterface = new Proxy(window.closeInterface, {
            apply: (target, thisArg, args) => {
                const closeListeners = this.listeners.interfacesc.filter(l => l.forInterface === args[0]);
                closeListeners.forEach(listener => {
                    listener.callback();
                });
                return Reflect.apply(target, thisArg, args);
            }
        });
        window.sendClientEvent = new Proxy(window.sendClientEvent, {
            apply: (target, thisArg, args) => {
                if (args[1] === "OnDialogResponse" && args[3] == 1) {
                    const dialog = window.currentDialog();
                    if (dialog ?.title ?.toLowerCase().includes("восстановление позици")) info.aspawnrecovery = true;
                }
                return Reflect.apply(target, thisArg, args);
            }
        });

        window.openLink = new Proxy(window.openLink, {
            apply: (target, thisArg, args) => {
                if (args[0].startsWith('copy:')) {
                    window.setClipboardText(args[0].replace('copy:', ''));
                    return true;
                }
                return Reflect.apply(target, thisArg, args);
            }
        });

        window.openInterface = new Proxy(window.openInterface, {
            apply: (target, thisArg, args) => {
                const activeListeners = this.listeners.interfaces.filter(l => l.forInterface === args[0]);
                let notShow = false;
                activeListeners.forEach(l => {
                    l.callBack(args);
                    if (l.notShow()) notShow = true;
                });
                if (!notShow) Reflect.apply(target, thisArg, args);
            }
        });

        Date.now = new Proxy(Date.now, {
            apply: (target, thisArg, args) => {
                let now = Reflect.apply(target, thisArg, args);
                while (chat.messages.find(m => m.time >= now)) now++;
                return now;
            }
        });

        window.onChatMessage = new Proxy(window.onChatMessage, {
            apply: (target, thisArg, args) => {
                this.listeners.chat.forEach(listener => listener.callback(args));
                return Reflect.apply(target, thisArg, args);
            }
        });

        window.addDialogInQueue = new Proxy(window.addDialogInQueue, {
            apply: (target, thisArg, args) => {
                const activeListeners = this.listeners.dialogs.filter(l => {
                    const names = Array.isArray(l.forDialog) ? l.forDialog : [l.forDialog];
                    return names.some(name => args[0].includes(name));
                });
                let notShow = false;
                activeListeners.forEach(l => {
                    l.callBack(args);
                    if (l.notShow()) notShow = true;
                });
                if (!notShow) return Reflect.apply(target, thisArg, args);
            }
        });

        window.sendChatInput = new Proxy(window.sendChatInput, {
            apply: (target, thisArg, args) => {
                if (!info.auth) return Reflect.apply(target, thisArg, args);
                const item = this.listeners.commands.find(l => args[0].toLowerCase().startsWith(l.name.toLowerCase() + " ") || args[0].toLowerCase() === l.name.toLowerCase());
                if (item) {
                    item.callback(args[0].split(" ").slice(1));
                    if (item.hide) return false;
                }
                return Reflect.apply(target, thisArg, args);
            }
        });
        const ChatHints = chat.$.type.components.ChatHints;
        const originalFilter = Array.prototype.filter;
        ChatHints.computed.hints = new Proxy(ChatHints.computed.hints, {
            apply: (t, thisArg, argList) => {
                Array.prototype.filter = new Proxy(originalFilter, {
                    apply: (fTarget, fThisArg, fArgs) => {
                        Array.prototype.filter = originalFilter;
                        chat.js = fThisArg;
                        this.listeners.commands.forEach(cmd => {
                            if (!fThisArg.includes(cmd.name)) fThisArg.push(cmd.name);
                        });
                        return Reflect.apply(fTarget, fThisArg, fArgs);
                    }
                });
                const result = Reflect.apply(t, thisArg, argList);
                Array.prototype.filter = originalFilter;
                return result;
            }
        });
    }
};