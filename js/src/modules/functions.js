import { InterfaceManager } from '../core/InterfaceManager';
function kick(nick) {
    const kickRegex = /Администратор\s+(\w+)(?:\[\d+\])?\s+кикнул игрока\s+(\w+)(?:\[\d+\])?(?:\.\s+Причина:\s*(.+))?/;
    return new Promise((resolve) => {
        let unsubscribe;
        const timer = setTimeout(() => {
            unsubscribe();
            resolve();
        }, 4000);
        unsubscribe = InterfaceManager.registerInterfChat(async(args) => {
            if (args[0].toLowerCase().includes("игрок с таким ником не найден")) {
                clearTimeout(timer);
                unsubscribe();
                resolve();
                return;
            }
            const kickMatch = args[0].match(kickRegex);
            if (kickMatch) {
                if (kickMatch[2].toLowerCase() === nick.toLowerCase()) {
                    clearTimeout(timer);
                    unsubscribe();
                    await new Promise(resolveDelay => setTimeout(resolveDelay, 2000));
                    resolve();
                }
            }
        });
    });
}

function goto(id) {
    return new Promise((resolve) => {
        let done = false;
        const finish = (success) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            unsubscribe();
            resolve(success);
        };
        const timer = setTimeout(() => finish(false), 30000);
        const unsubscribe = InterfaceManager.registerInterfChat((args) => {
            if (args[0].toLowerCase().includes("вы телепортировались к игроку")) finish(true);
        });
        window.sendChatInput(`/goto ${id}`);
    });
}

export const functions = {kick, goto};