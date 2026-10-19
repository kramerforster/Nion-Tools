import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';

const cleanNick = (s) => s.replace(/\[\d+\]/g, "").trim();

const updateReportMessages = (reports, apply) => {
    const chat = window.interface("Hud").$refs.chat.messages;
    chat.forEach((msg) => {
        if (msg.consider === false) return;
        if (!msg.content.some(p => p.text && p.text.includes("[!]"))) return;
        if (!msg.content.some(p => p.text && reports.some(r => p.text.includes(r.nick)))) return;
        msg.content.forEach(p => {
            if (p.text && p.text.includes("[!]")) apply(p);
        });
        msg.consider = false;
    });
};

export const Report = {
    name: 'Report',
    data: {
        reports: [],
    },
    init() {
        InterfaceManager.registerInterfChat((args) => {
            const reportMatch = /(?:\[[^\]]+\]\s+)?\[(RADMIR|HASSLE)\]\s+(\S+)\[(\d+)\]\s*:\s*(.+)/.exec(args[0]);
            if (reportMatch) {
                const rawNick = reportMatch[2];
                const nick = cleanNick(rawNick);
                const cleanedLine = args[0].replace(rawNick, nick);
                const player = Array.from(info.players.values()).find(p => p.id == reportMatch[3]);
                if (player) player.fakeName = player.name !== nick ? nick : "";
                const reportEntry = {
                    nick,
                    cleanNick: nick.toLowerCase(),
                    text: cleanedLine,
                    pText: `{ff2400}[!] {${args[1] ? args[1].slice(2) : 'ffffff'}}${cleanedLine}`,
                    color: args[1],
                    consider: true,
                    answered: false,
                    message_time: Date.now()
                };
                this.data.reports.push(reportEntry);
                args[0] = this.data.enabled ? reportEntry.pText : cleanedLine;
                return;
            }

            const responseMatch = /(?:Администратор|Агент поддержки)\s+(.+?)\[\d+\]\s+для\s+(.+?)\[\d+\]:\s+(.+?)\{btn:\d+:\d+:\d+\}/.exec(args[0]);
            if (responseMatch) {
                const relatedReports = this.data.reports.filter(r => r.consider === true && r.cleanNick === cleanNick(responseMatch[2]).toLowerCase());
                if (relatedReports.length > 0) {
                    relatedReports.forEach(report => {
                        report.consider = false;
                        report.answered = true;
                    });
                    if (this.data.enabled) {
                        updateReportMessages(relatedReports, (p) => {
                            if (info.report.mode === 1) {
                                p.text = "";
                            } else {
                                p.color = "ffcd00";
                            }
                        });
                    }
                }
            }

            const nickChangeMatch = /\[A\]\s+\S+\[\d+\]\s+принял заявку на смену ника с\s+(.+?)\s+на\s+(.+)$/.exec(args[0]);
            if (nickChangeMatch) {
                const oldNick = cleanNick(nickChangeMatch[1]);
                const newNick = cleanNick(nickChangeMatch[2]);
                const oldNickLower = oldNick.toLowerCase();

                const player = Array.from(info.players.values()).find(p => p.name.toLowerCase() === oldNickLower || p.fakeName.toLowerCase() === oldNickLower);
                if (player) {
                    if (player.name.toLowerCase() === oldNickLower) player.name = newNick;
                    if (player.fakeName.toLowerCase() === oldNickLower) player.fakeName = newNick;
                }
                this.data.reports.filter(r => r.nick.toLowerCase() === oldNickLower).forEach(r => {
                    r.nick = newNick;
                });
            }

            const rmuteMatch = /Администратор\s+(.+?)(?:\[\d+\])?\s+заблокировал репорт игроку\s+(.+?)(?:\[\d+\])?\s+на\s+(\d+)\s+мин/.exec(args[0]);
            if (rmuteMatch) {
                const relatedReports = this.data.reports.filter(r => r.consider === true && r.cleanNick === cleanNick(rmuteMatch[2]).toLowerCase());
                if (relatedReports.length > 0) {
                    relatedReports.forEach(report => {
                        report.consider = false;
                    });
                    if (this.data.enabled) {
                        updateReportMessages(relatedReports, (p) => {
                            p.color = "8751f0";
                        });
                    }
                }
            }
        });

        InterfaceManager.Events.on("playeroff", (player) => {
            if (!this.data.enabled) return;
            const names = new Set([player.name, player.fakeName].filter(Boolean).map((n) => n.toLowerCase()));
            const relatedReports = this.data.reports.filter(r => r.consider === true && names.has(r.nick.toLowerCase()));
            if (relatedReports.length > 0) {
                relatedReports.forEach(report => {
                    report.consider = false;
                });
                updateReportMessages(relatedReports, (p) => {
                    p.color = "8751f0";
                });
            }
        });
    },
    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    },
};