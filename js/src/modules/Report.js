import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';

const cleanNick = (s) => s.replace(/\[\d+\]/g, "").trim();

export const Report = {
    name: 'Report',
    data: {
        reports: [],
    },
    init() {
        InterfaceManager.registerInterfChat((args) => {
            const reportMatch = /(?:\[FAQ\]\s+)?\[(RADMIR|HASSLE)\]\s+(\S+)\[(\d+)\]\s*:\s*(.+)/.exec(args[0]);
            if (reportMatch) {
                const rawNick = reportMatch[2];
                const nick = cleanNick(rawNick);
                const cleanedLine = args[0].replace(rawNick, nick);
                const player = Array.from(info.players.values()).find(p => p.id == reportMatch[3]);

                if (player && player.name !== nick) {
                    player.fakeName = player.name;
                    player.name = nick;
                }

                const reportEntry = {
                    nick,
                    cleanNick: nick.toLowerCase(),
                    text: cleanedLine,
                    pText: `{ff2400}[!] {${args[1] ? args[1].slice(2) : 'ffffff'}}${cleanedLine}`,
                    color: args[1],
                    answered: false,
                    message_time: Date.now()
                };
                this.data.reports.push(reportEntry);
                args[0] = this.data.enabled ? reportEntry.pText : cleanedLine;
                return;
            }

            const responseMatch = /^(?:Администратор|Агент поддержки)\s+(.+?)\[\d+\]\s+для\s+(.+?)\[\d+\]:\s+(.+?)\{btn:\d+:\d+:\d+\}/.exec(args[0]);
            if (responseMatch) {
                const relatedReports = this.data.reports.filter(r => r.cleanNick === cleanNick(responseMatch[2]).toLowerCase() && !r.answered);
                if (relatedReports.length > 0) {
                    const lastReport = relatedReports[relatedReports.length - 1];
                    if (lastReport.answered) return;
                    lastReport.answered = true;
                    if (this.data.enabled) {
                        const chat = window.interface("Hud").$refs.chat.messages;
                        if (chat) {
                            chat.forEach((msg) => {
                                if (msg.content.map(p => p.text).join(" ").includes(lastReport.nick)) {
                                    msg.content.forEach(p => {
                                        if (p.text.includes("[!]")) {
                                            if (info.report.mode === 1) {
                                                p.text = "";
                                            } else {
                                                p.color = "ffcd00";
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    }
                }
                return;
            }

            const nickChangeMatch = /\[A\]\s+\S+\[\d+\]\s+принял заявку на смену ника с\s+(.+?)\s+на\s+(.+)$/.exec(args[0]);
            if (nickChangeMatch) {
                const oldNick = cleanNick(nickChangeMatch[1]);
                const newNick = cleanNick(nickChangeMatch[2]);
                const oldNickLower = oldNick.toLowerCase();
                const player = Array.from(info.players.values()).find(p => p.name.toLowerCase() === oldNickLower);
                if (player) player.name = newNick;
                this.data.reports.filter(r => r.cleanNick === oldNickLower).forEach(r => {
                    r.nick = newNick;
                    r.cleanNick = newNick.toLowerCase();
                });
                return;
            }

            const rmuteMatch = /^Администратор\s+(.+?)(?:\[\d+\])?\s+заблокировал репорт игроку\s+(.+?)(?:\[\d+\])?\s+на\s+(\d+)\s+мин/.exec(args[0]);
            if (rmuteMatch) {
                const relatedReports = this.data.reports.filter(r => !r.answered && r.cleanNick === cleanNick(rmuteMatch[2]).toLowerCase());
                relatedReports.forEach(lastReport => {
                    if (lastReport.answered) return;
                    lastReport.answered = true;
                    if (this.data.enabled) {
                        const chat = window.interface("Hud").$refs.chat.messages;
                        if (chat) {
                            chat.forEach((msg) => {
                                if (msg.content.map(p => p.text).join(" ").includes(lastReport.nick)) {
                                    msg.content.forEach(p => {
                                        if (p.text.includes("[!]")) {
                                            p.color = "8751f0";
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });

        InterfaceManager.Events.on("playeroff", (player) => {
            if (!this.data.enabled) return;
            const relatedReports = this.data.reports.filter(r => !r.answered && r.cleanNick === player.name.toLowerCase());
            relatedReports.forEach(lastReport => {
                if (lastReport.answered) return;
                lastReport.answered = true;
                const chat = window.interface("Hud").$refs.chat.messages;
                if (chat) {
                    chat.forEach((msg) => {
                        if (msg.content.map(p => p.text).join(" ").includes(lastReport.nick)) {
                            msg.content.forEach(p => {
                                if (p.text.includes("[!]")) {
                                    p.color = "8751f0";
                                }
                            });
                        }
                    });
                }
            });
        });
    },
    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    },
};