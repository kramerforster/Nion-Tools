import { InterfaceManager } from '../core/InterfaceManager';

const tplist = {
    category: undefined,
    selected: undefined
};

InterfaceManager.registerDialog(["телепортов", "Телепорт"], (args) => {
    if (tplist.category === undefined && tplist.selected === undefined) return;
    const dialog = JSON.parse(args[0]);

    if (dialog[2].includes("глобальных телепортов") && tplist.category !== undefined) {
        const items = args[1].split("<n>");
        if (items[tplist.category]) {
            window.sendClientEvent(0, { ignoreChat: true }, "OnDialogResponse", dialog[0], 1, tplist.category, "Nion Tools");
        } else {
            tplist.category = undefined;
            tplist.selected = undefined;
        }
        return;
    }

    if (dialog[2].includes("личных телепортов") && tplist.selected !== undefined) {
        const items = args[1].split("<n>");
        if (items[tplist.selected]) {
            window.sendClientEvent(0, { ignoreChat: true }, "OnDialogResponse", dialog[0], 1, tplist.selected, "Nion Tools");
        } else {
            tplist.category = undefined;
            tplist.selected = undefined;
        }
        return;
    }
    if (dialog[2].includes("Телепорт")) {
        window.sendClientEvent(0, { ignoreChat: true }, "OnDialogResponse", 0, 1, -1, "Nion Tools");
        setTimeout(() => {
            window.closeLastDialog();
        }, 32);
        tplist.category = undefined;
        tplist.selected = undefined;
        return;
    }
});

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
            if (args[0].toLowerCase().includes("вы телепортировались к игроку")) {
                finish(true);
            }
        });

        window.sendChatInput(`/goto ${id}`);
    });
}

export const functions = { kick, goto, tplist };