import { info } from '../config/state';

export const ApiService = {
    async getHost() {
        return new Promise((resolve) => {
            let completed = 0;
            let resolved = false;
            info.hosts.forEach((host, i) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", `${host}/ping`);
                xhr.timeout = 30000;
                const done = () => {
                    completed++;
                    if (completed === info.hosts.length && !resolved) {
                        resolved = true;
                        resolve(false);
                    }
                };
                xhr.onload = () => {
                    if (xhr.status === 200 && !resolved) {
                        resolved = true;
                        info.hostIndex = i;
                        resolve(true);
                        return;
                    }
                    done();
                };
                xhr.onerror = done;
                xhr.ontimeout = done;
                xhr.send();
            });
        });
    },
    async auth() {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            const host = info.hosts[info.hostIndex];
            
            xhr.open("POST", `${host}/auth`, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = () => {
                if (xhr.status === 200) {
                    try {
                        resolve({ success: true, data: JSON.parse(xhr.responseText) });
                    } catch {
                        resolve({ success: false });
                    }
                } else {
                    resolve({ success: false });
                }
            };
            xhr.onerror = xhr.ontimeout = () => resolve({ success: false });
            xhr.send(JSON.stringify({ nick: info.nick, sid: Number(info.server) }));
        });
    },
    async sendPost(url, data) {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", url, true);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = () => resolve(xhr.status === 200);
            xhr.onerror = xhr.ontimeout = () => resolve(false);
            xhr.send(JSON.stringify(data));
        });
    }
};