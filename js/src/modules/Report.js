import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';
export const Report = {
    name: 'Report',
    data: {
        reports: []
    },
    init() {
        InterfaceManager.registerInterfChat((args) => {
            const reportMatch = /\[(RADMIR|HASSLE)\] (\S+)\[(\d+)\] ?: (.+)/.exec(args[0]);
            if (reportMatch) {
                const player = Array.from(info.players.values()).find(p => p.id == reportMatch[3]);
                if (player && player.name !== reportMatch[2]) {
                    player.fakeName = player.name;
                    player.name = reportMatch[2];
                }
                const reportEntry = {
                    nick: reportMatch[2],
                    text: args[0],
                    pText: `{ff2400}[!] {${args[1].slice(2)}}${args[0]}`,
                    color: args[1],
                    answered: false,
                    message_time: Date.now()
                };
                this.data.reports.push(reportEntry);
                if (this.data.enabled) args[0] = reportEntry.pText;
                return;
            }
            const responseMatch = /(?:Администратор|Агент поддержки)\s+([\w_]+)\s*\[\d+\]\s+для\s+([\w_]+)\[\d+\]:\s+.+?\{btn:\d+:\d+:\d+\}/.exec(args[0]);
            if (responseMatch) {
                const relatedReports = this.data.reports.filter(r => r.nick === responseMatch[2] && !r.answered);
                if (relatedReports.length > 0) {
                    const lastReport = relatedReports[relatedReports.length - 1];
                    lastReport.answered = true;
                    if (this.data.enabled) {
                        const chat = window.interface("Hud").$refs.chat.messages;
                        chat.forEach((msg) => {
                            if (msg.content.map(p => p.text).join(" ").includes(lastReport.nick)) {
                                msg.content.forEach(p => {
                                    if (p.color === "ff2400") p.color = "ffcd00";
                                });
                            }
                        });
                    }
                }
            }
            const rmuteMatch = /Администратор ([\w_]+)(?:\[\d+\])? заблокировал репорт игроку ([\w_]+)(?:\[\d+\])? на \d+ мин/.exec(args[0]);
            if (rmuteMatch) {
                const relatedReports = this.data.reports.filter(r => !r.answered && r.nick === rmuteMatch[2]);
                relatedReports.forEach(lastReport => {
                    lastReport.answered = true;
                    const chat = window.interface("Hud").$refs.chat.messages;
                    chat.forEach((msg) => {
                        if (msg.content.map(p => p.text).join(" ").includes(lastReport.nick)) {
                            msg.content.forEach(p => {
                                if (p.color === "ff2400") p.color = "8751f0";
                            });
                        }
                    });
                });
            }
        });
        InterfaceManager.Events.on("playeroff", (player) => {
            if (!this.data.enabled) return;
            const relatedReports = this.data.reports.filter(r => !r.answered && r.nick === player.name);
            relatedReports.forEach(lastReport => {
                lastReport.answered = true;
                const chat = window.interface("Hud").$refs.chat.messages;
                chat.forEach((msg) => {
                    if (msg.content.map(p => p.text).join(" ").includes(lastReport.nick)) {
                        msg.content.forEach(p => {
                            if (p.color === "ff2400") p.color = "8751f0";
                        });
                    }
                });
            });
        });
    },
    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    }
};