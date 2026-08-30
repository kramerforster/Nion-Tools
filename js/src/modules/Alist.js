import { InterfaceManager } from '../core/InterfaceManager';
import { info } from '../config/state';

export const Alist = {
    name: 'Alist',
    data: {},
    init() {
        InterfaceManager.registerDialog("{FFCD00}Последние 30 наказаний за 2 месяца.", (args) => {
            if (!this.data.enabled) return;
            let parsedData = JSON.parse(args[0]);
            if (!parsedData || parsedData[1] !== 5) return;
            const lines = args[1].split("<n>");
            const thresholdMs = info.alistThresholdDays * 86400000; 
            args[1] = lines.map((entry, index) => {
                if (index === 0) return entry; 
                let dateMatch = entry.match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
                if (!dateMatch) return entry; 
                let entryDate = this.parseDate ? this.parseDate(dateMatch[0]) : new Date(dateMatch[0]);
                if (!entryDate || isNaN(entryDate.getTime())) return entry;
                let currentDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
                let timePassed = currentDate - entryDate;
                let colorCode = (timePassed > thresholdMs) ? "{FFFFFF}" : "{66CC00}";
                return entry.replace(dateMatch[0], `${colorCode}${dateMatch[0]}{66CC00}`);
            }).join("<n>");
        }); 
    },
    parseDate(dateString) {
        let match = dateString.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
        if (match) return new Date(Date.UTC(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]), parseInt(match[6])));
        match = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}T00:00:00Z`);
        match = dateString.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (match) return new Date(`${match[3]}-${match[1]}-${match[2]}T00:00:00Z`);
        let parsedDate = new Date(Date.parse(dateString));
        if (!isNaN(parsedDate.getTime())) return parsedDate;
        return null;
    },

    toggle(enabled) {
        this.data.enabled = typeof enabled === "boolean" ? enabled : !this.data.enabled;
    }
};