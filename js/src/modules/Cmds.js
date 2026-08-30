import { InterfaceManager } from '../core/InterfaceManager';
import { ApiService } from '../services/ApiService';
import { info } from '../config/state';
import { scripts } from './index';
import { Report } from './Report';
import { functions } from './functions';

export function initCmds() {

    InterfaceManager.registerCommand("/tpr", async(params) => {
        const id = params[0];
        if (window.getInterfaceStatus && window.getInterfaceStatus("AdminSpectate")) {
            const tp = await functions.goto(window.interface("AdminSpectate").player.id);
            if (!tp) return InterfaceManager.send("Функция goto не дождалась ответа");
        }
        const pPos = window.App.$store.getters["player/position"];
        window.discardRoute();
        const points = await new Promise((resolve) => {
            const timer = setTimeout(() => {
                engine.off("NavigationPathUpdated", handler);
                InterfaceManager.send("Функция getNavigationPath не дождалась ответа");
                resolve(null);
            }, 5000);
            const handler = (e) => {
                clearTimeout(timer);
                engine.off("NavigationPathUpdated", handler);
                resolve(JSON.parse(e));
            };
            engine.on("NavigationPathUpdated", handler);
            window.getNavigationPath(pPos.x, pPos.y, pPos.z, 0);
        });
        if (!points) return window.discardRoute();
        const last = points[points.length - 1];
        window.sendChatInput("/" + (window.interface("Hud").speedometer.show ? "vehpos" : "pos") + " " + last.join(",") + ",0");
        if (!id) return window.discardRoute();
        await new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
                unsubscribe();
                resolve();
            }, 20000);
            var unsubscribe = window.App.$store.subscribe((mutation, state) => {
                if (mutation.type === "player/setPosition") {
                    const distance = Math.hypot(state.player.position.x - last[0], state.player.position.y - last[1]);
                    if (distance < 3) {
                        unsubscribe();
                        clearTimeout(timeoutId);
                        setTimeout(() => window.sendChatInput(`/tpcar ${id}`), 100);
                        resolve();
                    }
                }
            });
        });

        window.discardRoute();
    });


    InterfaceManager.registerCommand("/abind", ({ formsData = [], findLog = [] } = {}) => {
        let container = document.getElementById("abind");
        if (container) {
            container.style.display = "flex";
            container.findLog = findLog;
            if (Array.isArray(formsData) && formsData.length) container.setFormsData(formsData);
            window.setCursorStatus("abind", true);
            document.removeEventListener("keydown", container.globalKeydownHandler);
            document.addEventListener("keydown", container.globalKeydownHandler);
            return;
        }

        container = document.createElement("div");
        container.id = "abind";
        container.isIssuing = false;
        container.findLog = findLog;
        container.style.position = "fixed";
        container.style.top = "50%";
        container.style.left = "50%";
        container.style.transform = "translate(-50%, -50%)";
        container.style.width = "1091px";
        container.style.maxWidth = "95vw";
        container.style.height = "888px";
        container.style.maxHeight = "95vh";
        container.style.background = "#141414ee";
        container.style.borderRadius = "8px";
        container.style.fontFamily = "'Open Sans', sans-serif";
        container.style.color = "#f4f1e1";
        container.style.zIndex = "10000";
        container.style.overflow = "hidden";
        container.style.border = "1px solid #f4f1e11a";
        container.style.display = "flex";
        container.style.flexDirection = "column";
        container.style.padding = "32px";
        container.style.boxSizing = "border-box";
        container.style.boxShadow = "0 24px 48px rgba(0,0,0,0.5)";

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";
        header.style.marginBottom = "20px";
        header.style.flex = "0 0 auto";

        const title = document.createElement("span");
        title.textContent = "Выдача оффлайн форм";
        title.style.color = "rgb(255, 255, 255)";
        title.style.fontSize = "22px";
        title.style.fontWeight = "600";
        title.style.letterSpacing = "0.5px";
        header.appendChild(title);
        const closeContainer = () => {
            container.style.display = "none";
            window.setCursorStatus("abind", false);
            document.removeEventListener("keydown", container.globalKeydownHandler);
        };

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "X";
        closeBtn.style.background = "none";
        closeBtn.style.border = "none";
        closeBtn.style.color = "#fff6";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "20px";
        closeBtn.style.fontWeight = "700";
        closeBtn.style.transition = "color 0.25s ease";
        closeBtn.onmouseover = () => closeBtn.style.color = "#f4f1e1";
        closeBtn.onmouseout = () => closeBtn.style.color = "#fff6";
        closeBtn.onclick = closeContainer;
        header.appendChild(closeBtn);

        let lines = Array.isArray(formsData) ? formsData.slice() : [];
        let editingIndex = -1;
        const listWrap = document.createElement("div");
        listWrap.style.flex = "1 1 auto";
        listWrap.style.minHeight = "0";
        listWrap.style.width = "100%";
        listWrap.style.background = "#ffffff0d";
        listWrap.style.border = "1px solid #ffffff1a";
        listWrap.style.borderRadius = "6px";
        listWrap.style.boxSizing = "border-box";
        listWrap.style.overflowY = "auto";
        listWrap.style.marginBottom = "16px";
        listWrap.style.boxShadow = "inset 0 5px 8px 0 #ffffff0d";
        listWrap.style.padding = "8px 20px";

        const emptyHint = document.createElement("div");
        emptyHint.textContent = "Список пуст.";
        emptyHint.style.color = "#f4f1e166";
        emptyHint.style.fontSize = "15px";
        emptyHint.style.padding = "10px 0";

        const smallBtnStyle = (btn, color) => {
            btn.style.background = "none";
            btn.style.border = "none";
            btn.style.color = color;
            btn.style.cursor = "pointer";
            btn.style.fontSize = "13px";
            btn.style.fontWeight = "700";
            btn.style.lineHeight = "1";
            btn.style.padding = "4px 8px";
            btn.style.transition = "color 0.2s ease";
            btn.style.fontFamily = "'Open Sans', sans-serif";
        };

        const flashInputError = (input) => {
            const originalBorder = input.style.borderColor;
            input.style.borderColor = "#ff4d4d";
            input.style.boxShadow = "0 0 10px rgba(255, 77, 77, 0.4)";
            setTimeout(() => {
                input.style.borderColor = input === document.activeElement ? (input === delayInput ? "#f9b70166" : "#f4f1e166") : originalBorder;
                input.style.boxShadow = "inset 0 5px 8px 0 #ffffff0d";
            }, 1200);
        };

        function renderList() {
            listWrap.innerHTML = "";
            if (!lines.length) {
                listWrap.appendChild(emptyHint);
                return;
            }
            lines.forEach((line, idx) => {
                const delayMatch = line.match(/^\{sl\s*(\d+)?\}$/i);
                const row = document.createElement("div");
                row.style.display = "flex";
                row.style.justifyContent = "space-between";
                row.style.alignItems = "center";
                row.style.padding = "8px 0";
                row.style.borderBottom = idx < lines.length - 1 ? "1px solid #ffffff14" : "none";

                if (idx === editingIndex) {
                    let editInput;
                    if (delayMatch) {
                        editInput = document.createElement("input");
                        editInput.type = "text";
                        editInput.value = delayMatch[1] || info.abindGroup.delay;
                    } else {
                        editInput = document.createElement("input");
                        editInput.type = "text";
                        editInput.value = line;
                    }
                    editInput.style.flex = "1";
                    editInput.style.background = "#ffffff14";
                    editInput.style.border = "1px solid #f4f1e166";
                    editInput.style.borderRadius = "4px";
                    editInput.style.color = "#f4f1e1";
                    editInput.style.padding = "6px 10px";
                    editInput.style.boxSizing = "border-box";
                    editInput.style.fontSize = "15px";
                    editInput.style.fontFamily = "'Open Sans', sans-serif";
                    editInput.style.outline = "none";
                    editInput.style.marginRight = "8px";
                    const save = () => {
                        if (delayMatch) {
                            let ms = parseInt(editInput.value, 10);
                            if (!Number.isFinite(ms) || ms < 0) {
                                InterfaceManager.send(" Неверный формат задержки.");
                                ms = info.abindGroup.delay;
                            } else if (ms > 300000) {
                                InterfaceManager.send("Задержка при редактировании снижена до лимита 300000 мс.");
                                ms = 300000;
                            }
                            lines[idx] = `{sl ${ms}}`;
                        } else {
                            const val = editInput.value.trim();
                            if (!val) return InterfaceManager.send("Поле ввода пустое.");
                            if (val.length > 150) return InterfaceManager.send("Длина измененной команды превышает лимит (максимум 150 символов).");
                            lines[idx] = val;
                        }
                        editingIndex = -1;
                        if (!container.isIssuing) formsData = lines.slice();
                        renderList();
                    };
                    const cancel = () => {
                        editingIndex = -1;
                        renderList();
                    };

                    editInput.onblur = () => {
                        setTimeout(() => {
                            if (editingIndex === idx) save();
                        }, 120);
                    };

                    editInput.onkeydown = (e) => {
                        if (e.code === 'Enter') {
                            if (e.preventDefault) e.preventDefault();
                            save();
                        } else if (e.code === 'Escape') {
                            if (e.preventDefault) e.preventDefault();
                            cancel();
                        }
                    };
                    const saveBtn = document.createElement("button");
                    saveBtn.textContent = "OK";
                    smallBtnStyle(saveBtn, "#f4f1e1");
                    saveBtn.onmousedown = (e) => e.preventDefault();
                    saveBtn.style.marginRight = "8px";
                    saveBtn.onclick = save;

                    const cancelBtn = document.createElement("button");
                    cancelBtn.textContent = "Отмена";
                    smallBtnStyle(cancelBtn, "#f4f1e166");
                    cancelBtn.onmousedown = (e) => e.preventDefault();
                    cancelBtn.onclick = cancel;

                    if (delayMatch) {
                        const suffix = document.createElement("span");
                        suffix.textContent = "мс";
                        suffix.style.color = "#f4f1e166";
                        suffix.style.fontSize = "14px";
                        suffix.style.marginRight = "8px";
                        row.appendChild(editInput);
                        row.appendChild(suffix);
                    } else {
                        row.appendChild(editInput);
                    }
                    row.appendChild(saveBtn);
                    row.appendChild(cancelBtn);

                    listWrap.appendChild(row);
                    editInput.focus();
                    editInput.select();
                    return;
                }

                if (delayMatch) {
                    row.style.background = "#f9b70114";
                    row.style.borderRadius = "4px";
                    row.style.padding = "7px 10px";
                    row.style.margin = "2px 0";
                    row.style.borderBottom = "none";
                }

                const text = document.createElement("span");
                text.textContent = delayMatch ? `Задержка: ${delayMatch[1] || info.abindGroup.delay}` : line;
                text.style.fontSize = "15px";
                text.style.color = delayMatch ? "#f9b701" : "#f4f1e1cc";
                text.style.fontWeight = delayMatch ? "700" : "400";
                text.style.flex = "1";
                text.style.overflow = "hidden";
                text.style.textOverflow = "ellipsis";
                text.style.whiteSpace = "nowrap";
                text.style.cursor = "text";
                text.style.marginRight = "8px";
                text.ondblclick = () => {
                    if (container.isIssuing) return;
                    editingIndex = idx;
                    renderList();
                };

                const editBtn = document.createElement("button");
                editBtn.textContent = "Ред.";
                smallBtnStyle(editBtn, delayMatch ? "#f9b70199" : "#f4f1e166");
                editBtn.style.marginRight = "8px";
                editBtn.onmouseover = () => editBtn.style.color = delayMatch ? "#f9b701" : "#f4f1e1";
                editBtn.onmouseout = () => editBtn.style.color = delayMatch ? "#f9b70199" : "#f4f1e166";
                editBtn.onclick = () => {
                    if (container.isIssuing) return;
                    editingIndex = idx;
                    renderList();
                };

                const removeBtn = document.createElement("button");
                removeBtn.textContent = "Удал.";
                smallBtnStyle(removeBtn, delayMatch ? "#f9b70199" : "#f4f1e166");
                removeBtn.onmouseover = () => removeBtn.style.color = "#ff6b6b";
                removeBtn.onmouseout = () => removeBtn.style.color = delayMatch ? "#f9b70199" : "#f4f1e166";
                removeBtn.onclick = () => {
                    if (container.isIssuing) return;
                    lines.splice(idx, 1);
                    if (editingIndex === idx) editingIndex = -1;
                    if (!container.isIssuing) formsData = lines.slice();
                    renderList();
                };

                row.appendChild(text);
                row.appendChild(editBtn);
                row.appendChild(removeBtn);
                listWrap.appendChild(row);
            });
            if (editingIndex === -1) listWrap.scrollTop = listWrap.scrollHeight;
        }

        container.setFormsData = (data) => {
            lines = Array.isArray(data) ? data.slice() : [];
            editingIndex = -1;
            if (!container.isIssuing) formsData = lines.slice();
            renderList();
        };

        renderList();
        const entryRow = document.createElement("div");
        entryRow.style.display = "flex";
        entryRow.style.marginBottom = "10px";
        entryRow.style.flex = "0 0 auto";

        const lineInput = document.createElement("input");
        lineInput.type = "text";
        lineInput.style.flex = "1";
        lineInput.style.background = "#ffffff0d";
        lineInput.style.border = "1px solid #ffffff1a";
        lineInput.style.borderRadius = "6px";
        lineInput.style.color = "#f4f1e1";
        lineInput.style.padding = "14px 18px";
        lineInput.style.boxSizing = "border-box";
        lineInput.style.fontSize = "16px";
        lineInput.style.fontFamily = "'Open Sans', sans-serif";
        lineInput.style.outline = "none";
        lineInput.style.boxShadow = "inset 0 5px 8px 0 #ffffff0d";
        lineInput.style.transition = "all 0.25s ease";
        lineInput.style.marginRight = "12px";

        lineInput.onfocus = () => {
            if (!lineInput.readOnly) lineInput.style.borderColor = "#f4f1e166";
        };
        lineInput.onblur = () => {
            if (!lineInput.readOnly) lineInput.style.borderColor = "#ffffff1a";
        };

        const addLine = () => {
            if (container.isIssuing) return;
            const val = lineInput.value.trim();
            if (!val) {
                InterfaceManager.send("Поле ввода пустое.");
                flashInputError(lineInput);
                return;
            }
            if (val.length > 150) {
                InterfaceManager.send("Команда слишком длинная максимум 150 символов.");
                flashInputError(lineInput);
                return;
            }
            lines.push(val);
            lineInput.value = "";
            editingIndex = -1;
            if (!container.isIssuing) formsData = lines.slice();
            renderList();
            lineInput.focus();
        };

        lineInput.onkeydown = (e) => {
            if (e.code === 'Enter') {
                if (e.preventDefault) e.preventDefault();
                addLine();
            }
        };

        const bulkWrap = document.createElement("div");
        bulkWrap.style.display = "none";
        bulkWrap.style.marginBottom = "10px";
        bulkWrap.style.flex = "0 0 auto";

        const bulkArea = document.createElement("textarea");
        bulkArea.style.width = "100%";
        bulkArea.style.height = "160px";
        bulkArea.style.background = "#ffffff0d";
        bulkArea.style.border = "1px solid #ffffff1a";
        bulkArea.style.borderRadius = "6px";
        bulkArea.style.color = "#f4f1e1";
        bulkArea.style.padding = "14px 18px";
        bulkArea.style.boxSizing = "border-box";
        bulkArea.style.fontSize = "15px";
        bulkArea.style.fontFamily = "'Open Sans', sans-serif";
        bulkArea.style.resize = "none";
        bulkArea.style.outline = "none";
        bulkArea.style.marginBottom = "10px";
        bulkArea.style.boxShadow = "inset 0 5px 8px 0 #ffffff0d";
        bulkArea.style.transition = "all 0.25s ease";

        bulkArea.onfocus = () => {
            if (!bulkArea.readOnly) bulkArea.style.borderColor = "#f4f1e166";
        };
        bulkArea.onblur = () => {
            if (!bulkArea.readOnly) bulkArea.style.borderColor = "#ffffff1a";
        };

        const bulkFooter = document.createElement("div");
        bulkFooter.style.display = "flex";
        bulkFooter.style.justifyContent = "flex-end";
        bulkFooter.style.marginBottom = "14px";

        bulkWrap.appendChild(bulkArea);
        bulkWrap.appendChild(bulkFooter);

        const closeBulk = () => {
            bulkWrap.style.display = "none";
            entryRow.style.display = "flex";
            bulkArea.value = "";
            pasteBtn.textContent = "Вставить формы";
        };

        const footer = document.createElement("div");
        footer.style.display = "flex";
        footer.style.justifyContent = "flex-end";
        footer.style.flex = "0 0 auto";

        const createBtn = (text, isAccent = false) => {
            const b = document.createElement("button");
            b.textContent = text;
            const bgColor = isAccent ? "#f9b70133" : "#ffffff0d";
            const borderColor = isAccent ? "#f9b701" : "#ffffff1a";
            const textColor = isAccent ? "#f9b701" : "#f4f1e1cc";

            b.style.border = `1px solid ${borderColor}`;
            b.style.borderRadius = "6px";
            b.style.padding = "14px 26px";
            b.style.cursor = "pointer";
            b.style.fontSize = "15px";
            b.style.fontWeight = "700";
            b.style.color = textColor;
            b.style.background = bgColor;
            b.style.fontFamily = "'Open Sans', sans-serif";
            b.style.transition = "all 0.2s ease";
            b.style.outline = "none";
            b.style.boxShadow = "inset 0 5px 8px 0 #ffffff0d";

            b.onmouseover = () => {
                if (!b.disabled) {
                    b.style.background = isAccent ? "#f9b7014d" : "#ffffff1a";
                    b.style.transform = "translateY(-1px)";
                }
            };
            b.onmouseout = () => {
                if (!b.disabled) {
                    b.style.background = bgColor;
                    b.style.transform = "translateY(0)";
                }
            };
            return b;
        };

        const bulkCancelBtn = createBtn("Отмена");
        bulkCancelBtn.style.marginRight = "12px";
        const bulkAddBtn = createBtn("Добавить в список", true);
        bulkCancelBtn.onclick = closeBulk;
        bulkAddBtn.onclick = () => {
            if (container.isIssuing) return;
            const pastedLines = bulkArea.value.split("\n").map(l => l.trim()).filter(Boolean);
            if (!pastedLines.length) return closeBulk();
            lines.push(...pastedLines);
            if (!container.isIssuing) formsData = lines.slice();
            renderList();
            closeBulk();
        };
        bulkFooter.appendChild(bulkCancelBtn);
        bulkFooter.appendChild(bulkAddBtn);

        bulkArea.onkeydown = (e) => {
            if (e.code === 'Enter') {
                if (e.preventDefault) e.preventDefault();
                bulkAddBtn.click();
            }
        };

        const addBtn = createBtn("Добавить", true);
        addBtn.style.marginRight = "12px";
        addBtn.onclick = addLine;

        const pasteBtn = createBtn("Вставить формы");
        pasteBtn.onclick = () => {
            if (container.isIssuing) return;
            const isOpen = bulkWrap.style.display !== "none";
            if (isOpen) {
                closeBulk();
            } else {
                bulkWrap.style.display = "block";
                entryRow.style.display = "none";
                bulkArea.focus();
            }
        };

        entryRow.appendChild(lineInput);
        entryRow.appendChild(addBtn);
        entryRow.appendChild(pasteBtn);

        const delayRow = document.createElement("div");
        delayRow.style.display = "flex";
        delayRow.style.alignItems = "center";
        delayRow.style.marginBottom = "24px";
        delayRow.style.flex = "0 0 auto";

        const delayLabel = document.createElement("span");
        delayLabel.textContent = "Задержка";
        delayLabel.style.color = "#f9b701";
        delayLabel.style.fontSize = "15px";
        delayLabel.style.fontWeight = "700";
        delayLabel.style.marginRight = "16px";

        const delayInput = document.createElement("input");
        delayInput.type = "text";
        delayInput.style.width = "110px";
        delayInput.style.background = "#ffffff0d";
        delayInput.style.border = "1px solid #ffffff26";
        delayInput.style.borderRadius = "6px";
        delayInput.style.color = "#f4f1e1";
        delayInput.style.padding = "14px 14px";
        delayInput.style.boxSizing = "border-box";
        delayInput.style.fontSize = "15px";
        delayInput.style.fontFamily = "'Open Sans', sans-serif";
        delayInput.style.outline = "none";
        delayInput.style.textAlign = "center";
        delayInput.style.boxShadow = "inset 0 5px 8px 0 #ffffff0d";
        delayInput.style.transition = "all 0.25s ease";
        delayInput.style.marginRight = "12px";

        delayInput.onfocus = () => {
            if (!delayInput.readOnly) delayInput.style.borderColor = "#f9b70166";
        };
        delayInput.onblur = () => {
            if (!delayInput.readOnly) delayInput.style.borderColor = "#ffffff26";
        };
        const delayMsLabel = document.createElement("span");
        delayMsLabel.textContent = "мс";
        delayMsLabel.style.color = "#f4f1e1aa";
        delayMsLabel.style.fontSize = "14px";
        delayMsLabel.style.marginRight = "20px";

        const addDelay = () => {
            if (container.isIssuing) return;
            const raw = delayInput.value.trim();
            const ms = raw ? parseInt(raw, 10) : info.abindGroup.delay;
            if (!raw || !Number.isFinite(ms) || ms < 0) {
                InterfaceManager.send("Введите корректное положительное число.");
                flashInputError(delayInput);
                return;
            }
            if (ms > 300000) {
                InterfaceManager.send("Задержка не может превышать 300000 мс (5 минут).");
                flashInputError(delayInput);
                return;
            }
            lines.push(`{sl ${ms}}`);
            delayInput.value = "";
            editingIndex = -1;
            if (!container.isIssuing) formsData = lines.slice();
            renderList();
        };
        delayInput.onkeydown = (e) => {
            if (e.code === 'Enter') {
                if (e.preventDefault) e.preventDefault();
                addDelay();
            }
        };

        const addDelayBtn = createBtn("Добавить задержку");
        addDelayBtn.onclick = addDelay;

        delayRow.appendChild(delayLabel);
        delayRow.appendChild(delayInput);
        delayRow.appendChild(delayMsLabel);
        delayRow.appendChild(addDelayBtn);

        const clearBtn = createBtn("Очистить");
        clearBtn.style.marginRight = "16px";
        const issueBtn = createBtn("Выдать формы", true);

        clearBtn.onclick = () => {
            if (container.isIssuing) return;
            lines = [];
            editingIndex = -1;
            if (!container.isIssuing) formsData = lines.slice();
            renderList();
        };
        issueBtn.onclick = async() => {
            if (container.isIssuing) return;
            editingIndex = -1;
            closeBulk();
            const rawLines = lines.slice();
            if (!rawLines.length) return InterfaceManager.send("Список форм пуст.");
            container.isIssuing = true;
            const btns = [clearBtn, issueBtn, addBtn, addDelayBtn, pasteBtn];
            btns.forEach(b => {
                b.disabled = true;
                b.style.opacity = "0.3";
                b.style.cursor = "default";
            });
            lineInput.readOnly = true;
            lineInput.style.opacity = "0.5";
            lineInput.style.pointerEvents = "none";
            delayInput.readOnly = true;
            delayInput.style.opacity = "0.5";
            delayInput.style.pointerEvents = "none";
            listWrap.style.opacity = "0.5";
            listWrap.style.pointerEvents = "none";
            renderList();

            const allGroups = info.abindGroup.order;
            const activeGroups = allGroups.filter(g => g.enabled);
            const lines_by_group = {};
            allGroups.forEach(g => lines_by_group[g.id] = []);
            const unmatched = [];
            let pendingDelays = [];
            rawLines.forEach(line => {
                const delayMatch = line.match(/^\{sl\s*(\d+)?\}$/i);
                if (delayMatch) return pendingDelays.push(line);
                const cmd = line.split(" ")[0];
                const group = allGroups.find(g => g.aliases.includes(cmd));
                const entry = { lines: [...pendingDelays, line] };
                pendingDelays = [];
                if (group) lines_by_group[group.id].push(entry);
                else unmatched.push(entry);
            });
            const trailingDelays = pendingDelays;
            const batchSize = info.abindGroup.batchSize;
            const groupDelayMs = info.abindGroup.delay;
            const max = Math.max(...activeGroups.map(g => lines_by_group[g.id].length), 0);
            const isDelayLine = (l) => typeof l === "string" && /^\{sl\s*(\d+)?\}$/i.test(l);
            const roundsFlat = [];
            for (let i = 0; i < max; i += batchSize) {
                const roundLines = [];
                activeGroups.forEach(g => {
                    const batch = lines_by_group[g.id].slice(i, i + batchSize);
                    batch.forEach(e => roundLines.push(...e.lines));
                });
                roundsFlat.push(roundLines);
            }
            const res = [];
            if (unmatched.length) unmatched.forEach(e => res.push(...e.lines));
            roundsFlat.forEach((roundLines, idx) => {
                res.push(...roundLines);
                const isLastRound = idx === roundsFlat.length - 1;
                if (!isLastRound) {
                    const lastOfThisRound = roundLines[roundLines.length - 1];
                    const nextRoundLines = roundsFlat[idx + 1];
                    const firstOfNextRound = nextRoundLines && nextRoundLines[0];
                    const alreadyHasDelay = (lastOfThisRound && isDelayLine(lastOfThisRound)) || (firstOfNextRound && isDelayLine(firstOfNextRound));
                    if (!alreadyHasDelay) res.push(`{sl ${groupDelayMs}}`);
                }
            });

            const disabledGroups = allGroups.filter(g => !g.enabled);
            disabledGroups.forEach(g => {
                lines_by_group[g.id].forEach(e => res.push(...e.lines))
            });
            res.push(...trailingDelays);

            lines = res.slice();
            formsData = lines.slice();
            renderList();

            const linesToIssue = res;
            for (let i = 0; i < linesToIssue.length; i++) {
                let line = linesToIssue[i].trim();
                let delayMs = 1000;
                const slMatch = line.match(/\{sl\s*(\d+)?\}/i);
                if (slMatch) {
                    delayMs = slMatch[1] ? parseInt(slMatch[1], 10) : 10;
                    line = line.replace(slMatch[0], "").trim();
                }
                if (line) {
                    const parts = line.split(/\s+/);
                    const cmd = parts[0];
                    const name = parts[1];
                    const group = allGroups.find(g => Array.isArray(g.aliases) && g.aliases.some(alias => alias.toLowerCase() === cmd.toLowerCase()));
                    if (group && group.checkOnline && name) {
                        const now = Date.now();
                        while (container.findLog.length && now - container.findLog[0] > 30000) container.findLog.shift();
                        if (container.findLog.length >= 3) {
                            const wait = 30000 - (now - container.findLog[0]);
                            if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
                            const afterWait = Date.now();
                            while (container.findLog.length && afterWait - container.findLog[0] > 30000) container.findLog.shift();
                        }
                        const onlinePlayer = Array.from(info.players.values()).find(player => player.name.trim().toLowerCase() === name.trim().toLowerCase());
                        if (onlinePlayer) {
                            window.sendChatInput(`/kick ${name}`);
                            await functions.kick(name)
                            container.findLog.push(Date.now());
                        }
                    }
                    InterfaceManager.send(`[ABIND] ${line}`);
                    window.sendChatInput(line);
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
            container.isIssuing = false;
            btns.forEach(b => {
                b.disabled = false;
                b.style.opacity = "1";
                b.style.cursor = "pointer";
            });
            lineInput.readOnly = false;
            lineInput.style.opacity = "1";
            lineInput.style.pointerEvents = "auto";
            delayInput.readOnly = false;
            delayInput.style.opacity = "1";
            delayInput.style.pointerEvents = "auto";
            listWrap.style.opacity = "1";
            listWrap.style.pointerEvents = "auto";
            InterfaceManager.send("[ABIND] Выдача успешно завершена.");
        };
        footer.appendChild(clearBtn);
        footer.appendChild(issueBtn);
        container.appendChild(header);
        container.appendChild(listWrap);
        container.appendChild(entryRow);
        container.appendChild(bulkWrap);
        container.appendChild(delayRow);
        container.appendChild(footer);
        document.body.appendChild(container);

        container.globalKeydownHandler = (e) => {
            if (e.code === 'Escape') {
                if (editingIndex !== -1) {
                    editingIndex = -1;
                    renderList();
                    return;
                }
                if (bulkWrap && bulkWrap.style.display !== "none") return closeBulk();
                closeContainer();
            }
        };

        document.addEventListener("keydown", container.globalKeydownHandler);
        window.setCursorStatus("abind", true);
    }, true);

    InterfaceManager.registerCommand("/atools", () => {
        let menu = () => {
            let items = [
                { name: "scripts", text: "Скрипты" },
                { name: "settings", text: "Настройки скриптов" },
                { name: "aspawn", text: "Настройки спавна" }
            ];
            InterfaceManager.createDialog(2, "Nion Tools", "", "Выбрать", "Закрыть", items.map(i => i.text).join("<n>"), async(selected) => {
                    let item = items.find(i => selected === i.text);
                    if (!item) return;
                    if (item.name === "scripts") openScripts();
                    else if (item.name === "settings") openSettingsScripts();
                    else if (item.name === "aspawn") openAspawn();
                },
                () => {});
        };

        let openScripts = () => {
            let scriptItems = Object.entries(scripts).map(([name, script]) => {
                return {
                    name,
                    text: `${script.data.enabled ? "{66CC00}[ON]" : "{FF5555}[OFF]"} {FFFFFF}${name}`
                };
            });
            InterfaceManager.createDialog(2, "Скрипты", "Список скриптов", "Выбрать", "Назад", scriptItems.map(i => i.text).join("<n>"), async(selectedScript) => {
                    let sItem = scriptItems.find(i => selectedScript.endsWith(" " + i.name));
                    if (!sItem) return menu();
                    let script = scripts[sItem.name];
                    script.toggle(!script.data.enabled);
                    let disabledList = Object.entries(scripts).filter(([n, s]) => s.data.enabled === false).map(([n]) => n);
                    InterfaceManager.send(`${sItem.name} ${script.data.enabled ? "включен" : "выключен"}`);
                    let data = { nick: info.nick, sid: info.server, disabled: disabledList };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    info.disabled = disabledList;
                    openScripts();
                },
                () => menu());
        };

        let openSettingsScripts = () => {
            let items = [
                { name: "AutoHealth", text: "Мин. хп" },
                { name: "Alist", text: "Настройки Alist" },
                { name: "InterfaceSP", text: "Кнопки спектейт-панели" },
                { name: "Abind", text: "Настройки автовыдачи форм" },
                { name: "Tp", text: "Клавиша телепорта" },
                { name: "SpecTP", text: "Клавиша телепорта из сп" },
                { name: "JoinFilters", text: "Фильтры входа игроков" }
            ];
            InterfaceManager.createDialog(2, "Настройки скриптов", "", "Выбрать", "Назад", items.map(i => i.text).join("<n>"), async(selected) => {
                    let item = items.find(i => selected === i.text);
                    if (!item) return menu();
                    if (item.name === "AutoHealth") openAutoHealthSettings();
                    else if (item.name === "Alist") openAlistSettings();
                    else if (item.name === "InterfaceSP") openInterfaceSPButtons();
                    else if (item.name === "Abind") openAbindSettings();
                    else if (item.name === "Tp") openTpSettings();
                    else if (item.name === "SpecTP") openSpecTpSettings();
                    else if (item.name === "JoinFilters") openJoinFilters();
                },
                () => menu());
        };
        let openJoinFilters = () => {
            let safeOperator = (op) => {
                if (op === "<=") return "≤";
                if (op === "<") return "‹";
                return op;
            };
            let filterItems = info.joinFilters.map((f, id) => {
                let label = `${f.param} ${safeOperator(f.operator)} ${f.value}`;
                return {
                    id,
                    name: label,
                    text: `${f.enabled !== false ? "{66CC00}[ON]" : "{FF5555}[OFF]"} {FFFFFF}${label}`
                };
            });
            filterItems.push({ id: -1, name: "Добавить фильтр", text: "{FFCD00}Добавить фильтр" });

            InterfaceManager.createDialog(2, "Фильтры входа", "Оповещение в чат при входе игроков", "Выбрать", "Назад", filterItems.map(i => i.text).join("<n>"), async(selected) => {
                    let fItem = filterItems.find(i => selected === i.name || selected.endsWith(i.name));
                    if (!fItem) return openSettingsScripts();

                    if (fItem.id === -1) {
                        openAddFilter();
                    } else {
                        openFilterActions(fItem.id);
                    }
                },
                () => openSettingsScripts()
            );
        };

        let openAutoHealthSettings = () => {
            InterfaceManager.createDialog(1, "Мин. хп", `Текущее: ${info.minHp}. Введите число (1-99)`, "Установить", "Назад", "", async(value) => {
                    let num = parseInt(value, 10);
                    if (isNaN(num) || num < 1 || num > 99) {
                        InterfaceManager.send("Некорректное значение. Введите число от 1 до 99.");
                        return openAutoHealthSettings();
                    }
                    let data = { nick: info.nick, sid: info.server, min_hp: num };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    info.minHp = num;
                    InterfaceManager.send(`Минимальное HP установлено: ${num}`);
                    openSettingsScripts();
                },
                () => openSettingsScripts());
        };



        let openAddFilter = () => {
            if (info.joinFilters.length >= 50) {
                InterfaceManager.send("Превышен лимит фильтров максимум 50");
                return openJoinFilters();
            }
            InterfaceManager.createDialog(1, "Новый фильтр", "Формат: параметр оператор значение (напр. score>=1000)", "Добавить", "Назад", "", async(value) => {
                    const match = value.trim().match(/^(id|name|score|ping)\s*(>=|<=|>|<|~|=)\s*(.+)$/i);
                    if (!match) {
                        InterfaceManager.send("Некорректный формат. Пример: score>=1000, name~admin, ping<=50");
                        return openAddFilter();
                    }
                    const param = match[1].toLowerCase();
                    const operator = match[2];
                    const rawValue = match[3].trim();
                    if (rawValue.length === 0 || rawValue.length > 50) {
                        InterfaceManager.send("Длина значения фильтра должна быть от 1 до 50 символов");
                        return openAddFilter();
                    }
                    if (["id", "score", "ping"].includes(param)) {
                        const isNumeric = /^\d+$/.test(rawValue);
                        if (!isNumeric) {
                            InterfaceManager.send(`Значение для "${param}" должно быть целым числом без лишних символов и текста.`);
                            return openAddFilter();
                        }
                    }
                    const parsed = { param, operator, value: rawValue, enabled: true };
                    const isDuplicate = info.joinFilters.some(f => f.param === parsed.param && f.operator === parsed.operator && String(f.value).toLowerCase() === parsed.value.toLowerCase());
                    if (isDuplicate) {
                        InterfaceManager.send(`Фильтр уже существует: ${parsed.param} ${parsed.operator} ${parsed.value}`);
                        return openAddFilter();
                    }

                    info.joinFilters.push(parsed);
                    let data = { nick: info.nick, sid: info.server, join_filters: info.joinFilters };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    InterfaceManager.send(`Фильтр добавлен: ${parsed.param} ${parsed.operator} ${parsed.value}`);
                    openJoinFilters();
                },
                () => openJoinFilters()
            );
        };

        let openFilterActions = (id) => {
            let filter = info.joinFilters[id];
            if (!filter) return openJoinFilters();
            let actions = [
                { name: "toggle", text: `${filter.enabled !== false ? "Выключить" : "Включить"}` },
                { name: "delete", text: "Удалить фильтр" }
            ];

            InterfaceManager.createDialog(2, `Фильтр: ${filter.param} ${filter.operator} ${filter.value}`, "", "Выбрать", "Назад", actions.map(a => a.text).join("<n>"), async(selectedAction) => {
                    if (selectedAction.includes("Включить") || selectedAction.includes("Выключить")) {
                        filter.enabled = filter.enabled === false;
                        let data = { nick: info.nick, sid: info.server, join_filters: info.joinFilters };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        InterfaceManager.send(`Фильтр ${filter.enabled !== false ? "включен" : "выключен"}.`);
                        openJoinFilters();
                    } else if (selectedAction.includes("Удалить")) {
                        info.joinFilters.splice(id, 1);
                        let data = { nick: info.nick, sid: info.server, join_filters: info.joinFilters };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        InterfaceManager.send("Фильтр успешно удален.");
                        openJoinFilters();
                    }
                },
                () => openJoinFilters()
            );
        };
        let openTpSettings = () => {
            InterfaceManager.createKeybindPicker(async(keys) => {
                    if (keys.length) {
                        info.keybindTP = keys;
                        let data = {
                            nick: info.nick,
                            sid: info.server,
                            keybind_tp: keys
                        };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        InterfaceManager.send(`Клавиши телепорта установлены: ${keys.join(" + ")}`);
                    } else {
                        InterfaceManager.send("Клавиши не выбраны.");
                    }
                    openSettingsScripts();
                },
                () => openSettingsScripts(),
                info.keybindTP
            );
        };
        let openSpecTpSettings = () => {
            InterfaceManager.createKeybindPicker(async(keys) => {
                    if (keys.length) {
                        info.keybindSpecTP = keys;
                        let data = {
                            nick: info.nick,
                            sid: info.server,
                            keybind_spectp: keys
                        };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        InterfaceManager.send(`Клавиши телепорта из спектейта установлены: ${keys.join(" + ")}`);
                    } else {
                        InterfaceManager.send("Клавиши не выбраны.");
                    }
                    openSettingsScripts();
                },
                () => openSettingsScripts(),
                info.keybindSpecTP
            );
        };
        let openAlistSettings = () => {
            InterfaceManager.createDialog(1, "Порог даты Алист", `Текущее: ${info.alistThresholdDays} дн. Введите число (1-365)`, "Установить", "Назад", "", async(value) => {
                    let num = parseInt(value, 10);
                    if (isNaN(num) || num < 1 || num > 365) {
                        InterfaceManager.send("Некорректное значение. Введите число от 1 до 365.");
                        return openAlistSettings();
                    }
                    let data = { nick: info.nick, sid: info.server, alist_threshold_days: num };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    info.alistThresholdDays = num;
                    InterfaceManager.send(`Порог Алист установлен: ${num} дн.`);
                    openSettingsScripts();
                },
                () => openSettingsScripts());
        };

        let openInterfaceSPButtons = () => {
            let buttonItems = info.spButtons.map(b => {
                return {
                    id: b.id,
                    name: b.text,
                    text: `${b.disabled ? "{FF5555}[OFF]" : "{66CC00}[ON]"} {FFFFFF}${b.text}`
                };
            });
            InterfaceManager.createDialog(2, "Спектейт-панель", "Кнопки", "Выбрать", "Назад", buttonItems.map(i => i.text).join("<n>"), async(selectedButton) => {
                    let bItem = buttonItems.find(i => selectedButton.endsWith(" " + i.name));
                    if (!bItem) return openSettingsScripts();
                    let btn = info.spButtons.find(b => b.id === bItem.id);
                    btn.disabled = !btn.disabled;
                    let disabledIds = info.spButtons.filter(b => b.disabled).map(b => b.id);
                    let data = { nick: info.nick, sid: info.server, sp_buttons_disabled: disabledIds };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    InterfaceManager.send(`${bItem.name} ${btn.disabled ? "выключена" : "включена"}`);
                    openInterfaceSPButtons();
                },
                () => openSettingsScripts());
        };

        let openAbindSettings = () => {
            let subItems = [
                { name: "batchSize", text: "Размер пачки" },
                { name: "delay", text: "Задержка между пачками" },
                { name: "order", text: "Список групп" },
                { name: "clear", text: "Очистить группы" }
            ];
            InterfaceManager.createDialog(2, "Настройки автовыдачи форм", "", "Выбрать", "Назад", subItems.map(i => i.text).join("<n>"), async(selectedSub) => {
                    let subItem = subItems.find(i => selectedSub === i.text);
                    if (!subItem) return openSettingsScripts();
                    if (subItem.name === "batchSize") openBatchSize();
                    else if (subItem.name === "delay") openDelay();
                    else if (subItem.name === "order") openOrderList();
                    else if (subItem.name === "clear") openClear();
                },
                () => openSettingsScripts());
        };

        let openBatchSize = () => {
            InterfaceManager.createDialog(1, "Размер пачки", `Текущее: ${info.abindGroup.batchSize}. Введите число (1-10)`, "Установить", "Назад", "", async(value) => {
                    let num = parseInt(value, 10);
                    if (isNaN(num) || num < 1 || num > 10) {
                        InterfaceManager.send("Некорректное значение. Введите число от 1 до 10.");
                        return openBatchSize();
                    }
                    info.abindGroup.batchSize = num;
                    let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    InterfaceManager.send(`Размер пачки установлен: ${num}`);
                    openAbindSettings();
                },
                () => openAbindSettings());
        };

        let openDelay = () => {
            InterfaceManager.createDialog(1, "Задержка между пачками", `Текущее: ${info.abindGroup.delay} мс. Введите число (1000-300000)`, "Установить", "Назад", "", async(value) => {
                    let num = parseInt(value, 10);
                    if (isNaN(num) || num < 1000 || num > 300000) {
                        InterfaceManager.send("Некорректное значение. Введите число от 1000 до 300000.");
                        return openDelay();
                    }
                    info.abindGroup.delay = num;
                    let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    InterfaceManager.send(`Задержка установлена: ${num} мс`);
                    openAbindSettings();
                },
                () => openAbindSettings());
        };

        let openOrderList = () => {
            let orderItems = info.abindGroup.order.map((o) => {
                return {
                    id: o.id,
                    name: o.label,
                    text: `${o.enabled ? "{66CC00}[ON]" : "{FF5555}[OFF]"} {FFFFFF}${o.label}`
                };
            });
            orderItems.push({ id: -1, name: "Добавить группу", text: "{FFCD00}Добавить группу" });
            InterfaceManager.createDialog(2, "Порядок групп", "", "Выбрать", "Назад", orderItems.map(i => i.text).join("<n>"), async(selectedOrder) => {
                    let oItem = orderItems.find(i => selectedOrder === i.name || selectedOrder.endsWith(" " + i.name));
                    if (!oItem) return openAbindSettings();
                    if (oItem.id === -1) {
                        if (info.abindGroup.order.length >= 50) {
                            InterfaceManager.send("Достигнут лимит в 50 групп.");
                            return openOrderList();
                        }
                        return openAddOrder();
                    }
                    openOrderActions(oItem.id);
                },
                () => openAbindSettings());
        };
        let openClear = async() => {
            const order = [{ id: 2, label: "Оффварн", aliases: ["/offwarn"], enabled: true, checkOnline: true },
                { id: 3, label: "Оффджейл", aliases: ["/offjail"], enabled: true, checkOnline: true },
                { id: 4, label: "Бан", aliases: ["/offban", "/soffban"], enabled: true, checkOnline: true },
                { id: 5, label: "Ганбан", aliases: ["/gunban"], enabled: true, checkOnline: false },
                { id: 6, label: "Мут", aliases: ["/mute", "/v_mute", "/fmute", "/rmute"], enabled: true, checkOnline: false }
            ]
            info.abindGroup.order = order;
            const data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
            await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
            InterfaceManager.send("Список групп сброшен.");
            openOrderList();
        };
        let openAddOrder = () => {
            InterfaceManager.createDialog(1, "Новая группа", "Введите название группы", "Далее", "Назад", "", async(value) => {
                    let label = value.trim();
                    if (!label || label.length > 100) {
                        InterfaceManager.send("Название не может быть пустым или длиннее 100 символов.");
                        return openAddOrder();
                    }
                    pendingGroupLabel = label;
                    openAddOrderAlias();
                },
                () => openOrderList());
        };

        let pendingGroupLabel = "";
        let openAddOrderAlias = () => {
            InterfaceManager.createDialog(1, "Первый алиас", "Введите команду", "Добавить", "Назад", "", async(value) => {
                    let alias = value.trim();
                    const aliasRegex = /^\/[a-zA-Z0-9_]+$/;
                    if (!alias || alias.length > 50 || !aliasRegex.test(alias)) {
                        InterfaceManager.send("Некорректный алиас (должен начинаться с / и содержать только латиницу, цифры и _, до 50 символов).");
                        return openAddOrderAlias();
                    }
                    let newId = Math.max(0, ...info.abindGroup.order.map(o => o.id)) + 1;
                    info.abindGroup.order.push({ id: newId, label: pendingGroupLabel, aliases: [alias], enabled: true, checkOnline: false });
                    let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    InterfaceManager.send(`Группа "${pendingGroupLabel}" добавлена.`);
                    openOrderList();
                },
                () => openOrderList());
        };

        let openOrderActions = (groupId) => {
            let group = info.abindGroup.order.find(o => o.id === groupId);
            if (!group) return openOrderList();
            let actions = [
                { name: "toggle", label: "Вкл/Выкл", text: `${group.enabled ? "{66CC00}[ON]" : "{FF5555}[OFF]"} {FFFFFF}Вкл/Выкл` },
                { name: "checkOnline", label: "Проверка онлайна", text: `${group.checkOnline ? "{66CC00}[ON]" : "{FF5555}[OFF]"} {FFFFFF}Проверка онлайна` },
                { name: "aliases", label: "Алиасы кмд", text: "{FFFFFF}Алиасы кмд" },
                { name: "delete", label: "Удалить группу", text: "{FF5555}Удалить группу" }
            ];
            InterfaceManager.createDialog(2, group.label, "", "Выбрать", "Назад", actions.map(a => a.text).join("<n>"), async(selectedAction) => {
                    let action = actions.find(a => selectedAction.includes(a.label));
                    if (!action) return openOrderList();
                    if (action.name === "toggle") {
                        group.enabled = !group.enabled;
                        let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        InterfaceManager.send(`Группа "${group.label}" ${group.enabled ? "включена" : "выключена"}.`);
                        openOrderActions(groupId);
                    } else if (action.name === "checkOnline") {
                        group.checkOnline = !group.checkOnline;
                        let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        InterfaceManager.send(`Проверка онлайна для "${group.label}" ${group.checkOnline ? "включена" : "выключена"}.`);
                        openOrderActions(groupId);
                    } else if (action.name === "delete") {
                        info.abindGroup.order = info.abindGroup.order.filter(o => o.id !== groupId);
                        let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        InterfaceManager.send(`Группа "${group.label}" удалена.`);
                        openOrderList();
                    } else if (action.name === "aliases") {
                        openAliasList(groupId);
                    }
                },
                () => openOrderList());
        };

        let openAliasList = (groupId) => {
            let group = info.abindGroup.order.find(o => o.id === groupId);
            if (!group) return openOrderList();
            let aliasItems = group.aliases.map(a => {
                return { name: a, isAdd: false, text: `{FFFFFF}${a}` };
            });
            aliasItems.push({ name: "Добавить алиас", isAdd: true, text: "{FFCD00}Добавить алиас" });
            InterfaceManager.createDialog(2, `Алиасы: ${group.label}`, "", "Выбрать", "Назад", aliasItems.map(i => i.text).join("<n>"), async(selectedAlias) => {
                    let aItem = aliasItems.find(i => selectedAlias === i.name || selectedAlias.endsWith(" " + i.name));
                    if (!aItem) return openOrderList();
                    if (aItem.isAdd) {
                        if (group.aliases.length >= 20) {
                            InterfaceManager.send("Достигнут предел в 20 алиасов для этой группы.");
                            return openAliasList(groupId);
                        }
                        openAddAlias(groupId);
                        return;
                    }
                    if (group.aliases.length <= 1) {
                        InterfaceManager.send("У группы должен остаться хотя бы один алиас.");
                        return openAliasList(groupId);
                    }
                    group.aliases = group.aliases.filter(a => a !== aItem.name);
                    let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    InterfaceManager.send(`Алиас "${aItem.name}" удалён.`);
                    openAliasList(groupId);
                },
                () => openOrderList());
        };

        let openAddAlias = (groupId) => {
            let group = info.abindGroup.order.find(o => o.id === groupId);
            if (!group) return openOrderList();
            InterfaceManager.createDialog(1, "Новый алиас", "Введите команду", "Добавить", "Назад", "", async(value) => {
                    let alias = value.trim();
                    const aliasRegex = /^\/[a-zA-Z0-9_]+$/;
                    if (!alias || alias.length > 50 || !aliasRegex.test(alias)) {
                        InterfaceManager.send("Некорректный алиас (должен начинаться с / и содержать только латиницу, цифры и _, до 50 символов).");
                        return openAddAlias(groupId);
                    }
                    if (group.aliases.includes(alias)) {
                        InterfaceManager.send("Такой алиас уже есть.");
                        return openAddAlias(groupId);
                    }
                    group.aliases.push(alias);
                    let data = { nick: info.nick, sid: info.server, abind_group: info.abindGroup };
                    await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                    InterfaceManager.send(`Алиас "${alias}" добавлен.`);
                    openAliasList(groupId);
                },
                () => openAliasList(groupId)
            );
        };

        let openAspawn = () => {
            let subItems = [
                { name: "set", text: "Установить спавн" },
                { name: "clear", text: "Очистить спавн" },
                { name: "tp", text: "Телепортироваться на спавн" }
            ];
            InterfaceManager.createDialog(2, "Настройки спавна", "", "Выбрать", "Назад", subItems.map(i => i.text).join("<n>"), async(selectedAspawn) => {
                    let subItem = subItems.find(i => selectedAspawn === i.text);
                    if (!subItem) return menu();
                    if (subItem.name === "set") {
                        const pPos = window.App.$store.getters["player/position"];
                        let data = { nick: info.nick, sid: info.server, aspawn_x: pPos.x, aspawn_y: pPos.y, aspawn_z: pPos.z, aspawn_interior: pPos.interior };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        info.aspawn = { x: pPos.x, y: pPos.y, z: pPos.z, interior: pPos.interior };
                        InterfaceManager.send("Координаты спавна установлены.");
                        openAspawn();
                    } else if (subItem.name === "clear") {
                        let data = { nick: info.nick, sid: info.server, aspawn_x: 0, aspawn_y: 0, aspawn_z: 0, aspawn_interior: 0 };
                        await ApiService.sendPost(`${info.hosts[info.hostIndex]}/set_settings`, data);
                        info.aspawn = { x: 0, y: 0, z: 0, interior: 0 };
                        InterfaceManager.send("Координаты спавна успешно очищены");
                        openAspawn();
                    } else if (subItem.name === "tp") {
                        if (info.aspawn.x === 0 && info.aspawn.y === 0) return InterfaceManager.send("Координаты спавна не установлены.");
                        if (window.getInterfaceStatus("AdminSpectate")) return InterfaceManager.send("Телепортация в режиме наблюдателя недоступна.");
                        window.sendChatInput(`/${window.interface("Hud").speedometer.show ? "vehpos" : "pos"} ${info.aspawn.x},${info.aspawn.y},${info.aspawn.z},${info.aspawn.interior},0`);
                    }
                },
                () => menu()
            );
        };

        menu();
    }, true);
    InterfaceManager.registerCommand("/mansions", async({
        mansions = [
            { name: "Западный особняк", ownerId: null, ownerName: null, founder: null },
            { name: "Северный особняк", ownerId: null, ownerName: null, founder: null },
            { name: "База Пэла", ownerId: null, ownerName: null, founder: null },
            { name: "Центральный особняк", ownerId: null, ownerName: null, founder: null }
        ]
    } = {}) => {
        if (InterfaceManager.isChecking) {
            InterfaceManager.isChecking = false;
            return InterfaceManager.send("Проверка принудительно остановлена");
        }
        InterfaceManager.isChecking = true;
        window.sendChatInput(`/phone`);
        window.sendChatInput(`/gangs`);
        let phoneTimeout;
        const run = (callback, condition) => {
            InterfaceManager.executeFunctionWhen(() => {
                if (!InterfaceManager.isChecking) return;
                callback();
            }, () => {
                if (!InterfaceManager.isChecking) return true;
                return condition();
            });
        };
        const unregisterDialog = InterfaceManager.registerDialog(["Присоединиться к семье?", "семьи в игре"], () => {
            if (!InterfaceManager.isChecking) return;
            window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnDialogResponse", 0, 1, 1, `Nion Tools`);
            run(() => {
                const title = window.currentDialog() ?.title ?.toLowerCase();
                if (["присоединиться к семье?", "семьи в игре"].some(phrase => title.includes(phrase))) window.closeLastDialog();
            }, () => {
                return !!window.currentDialog();
            });
        });

        phoneTimeout = setTimeout(() => {
            if (InterfaceManager.isChecking) {
                InterfaceManager.isChecking = false;
                unregisterDialog();
                InterfaceManager.send("Отмена телефон не открылся за 2 секунды");
            }
        }, 2000);
        run(() => {
            clearTimeout(phoneTimeout);
            if (!InterfaceManager.isChecking) return;
            window.interface("Phone").openApp(14);
            run(() => {
                const app = window.interface("Phone").getCurrentApp();
                app.setCurrentPage("DISTRICTS_CONTROL");
                run(async() => {
                    if (!InterfaceManager.isChecking) return;
                    const page = app.page();
                    mansions.forEach(mansion => {
                        const point = page.points.find(p => p.specialName && p.specialName.toUpperCase() === mansion.name.toUpperCase());
                        if (point) {
                            mansion.ownerId = point.ownerId;
                            mansion.ownerName = point.ownerId >= 0 ? (point.ownerName || "Неизвестно") : "Свободен";
                        }
                    });
                    for (const mansion of mansions) {
                        if (!InterfaceManager.isChecking) return;
                        const owned = mansion.ownerId !== null && mansion.ownerId >= 0;
                        if (!owned) continue;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        if (!InterfaceManager.isChecking) return;
                        window.sendChatInput(`/gangs ${mansion.ownerId}`);
                        const moved = await new Promise((resolve) => {
                            let resolved = false;
                            const unregisterChat = InterfaceManager.registerInterfChat((args) => {
                                if (args[0].toLowerCase().includes("вы были временно перемещены в семью") && !resolved) {
                                    resolved = true;
                                    unregisterChat();
                                    resolve(true);
                                } else if (args[0].toLowerCase().includes("вы указали неверный id семьи") && !resolved) {
                                    resolved = true;
                                    unregisterChat();
                                    resolve(false);
                                }
                            });
                            setTimeout(() => {
                                if (!resolved) {
                                    resolved = true;
                                    unregisterChat();
                                    resolve(false);
                                }
                            }, 2000);
                        });
                        if (!moved) continue;
                        if (!InterfaceManager.isChecking) return;
                        mansion.founder = await new Promise((resolve) => {
                            const gangsApp = window.interface("Phone").$refs.gangs;
                            if (!gangsApp) return resolve(null);
                            const origMain = gangsApp.setAsideStatsData;
                            const boundOrigMain = origMain.bind(gangsApp);
                            let resolved = false;
                            gangsApp.setAsideStatsData = (s) => {
                                boundOrigMain(s);
                                if (!resolved) {
                                    resolved = true;
                                    gangsApp.setAsideStatsData = origMain;
                                    const founder = gangsApp.DEFAULT_PAGES.MAIN.params.asideStatsData.founder;
                                    resolve(founder);
                                }
                            };
                            window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "FAMTBL_OnPlayerOpenTab", 0);
                        });
                    }
                    if (!InterfaceManager.isChecking) return;
                    InterfaceManager.isChecking = false;
                    unregisterDialog();
                    if (window.getInterfaceStatus("Phone")) window.sendChatInput(`/phone`);
                    const lines = mansions.map(mansion => {
                        if (mansion.ownerId !== null && mansion.ownerId >= 0) {
                            return `${mansion.name}\nВладелец: {copy:${mansion.ownerName}} (ID: ${mansion.ownerId})\nОснователь: {copy:${mansion.founder || "не найден"}}`;
                        } else {
                            return `${mansion.name}\nСвободен`;
                        }
                    });
                    const dialogText = lines.join("<n>");
                    InterfaceManager.createDialog(0, "Результаты проверки", "", "Закрыть", "", dialogText)
                }, () => {
                    const page = app.page();
                    if (!page || !Array.isArray(page.points)) return false;
                    const specialNames = page.points.map(p => p.specialName ? p.specialName.toUpperCase() : "");
                    return mansions.every(m => specialNames.includes(m.name.toUpperCase()));
                });
            }, () => {
                const app = window.interface("Phone").getCurrentApp();
                return !!app && !!app.currentPage && app.currentPage.componentName === "MAIN";
            });
        }, () => {
            return !!window.interface("Phone");
        });
    }, true);

    InterfaceManager.registerCommand("/atp", () => {
        if (info.aspawn.x === 0 && info.aspawn.y === 0) return InterfaceManager.send("Координаты спавна не установлены");
        if (window.getInterfaceStatus("AdminSpectate")) return InterfaceManager.send(`Телепортация в режиме наблюдателя недоступна.`);
        window.sendChatInput(`/${window.interface("Hud").speedometer.show ? "vehpos" : "pos"} ${info.aspawn.x},${info.aspawn.y},${info.aspawn.z},${info.aspawn.interior},0`);
    }, true);


    InterfaceManager.registerCommand("/index", () => {
        if (!Report.data.reports.length) return InterfaceManager.send(`Нет данных для анализа.`);
        const recentReports = Report.data.reports.filter(r => Date.now() - r.message_time <= 600000);
        if (!recentReports.length) return InterfaceManager.send("За последние 10 минут нет репортов.");
        const answeredCount = recentReports.filter(r => r.answered).length;
        const index = answeredCount / recentReports.length;
        InterfaceManager.send(`Индекс ответов: ${index.toFixed(2)} (${answeredCount}/${recentReports.length})`, "00FFFFFF");
    }, true);
}