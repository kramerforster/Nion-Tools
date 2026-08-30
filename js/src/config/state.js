export const info = {
    i: false,
    version: '1.2.1',
    nick: undefined,
    server: undefined,
    auth: false,
    copy: false,
    isPlayersFirstUpdate: true,
    aspawnrecovery: false,
    players: new Map(),
    local: { id: -1, name: "", score: 0, ping: 0 },
    joinFilters: [],
    hostIndex: undefined,
    hosts: [
        "https://podd.nionbot.ru/api",
        "https://nionbot.ru/api",
        "https://v3008641.hosted-by-vdsina.ru/api"
    ],
    aspawn: {
        x: 0,
        y: 0,
        z: 0,
        interior: 0,
    },
    disabled: [],
    minHp: 75,
    keybindTP: ['Home'],
    keybindSpecTP: ['F10'],
    alistThresholdDays: 14,
    abindGroup: {
        batchSize: 2,
        delay: 70000,
        order: []
    },
    spButtons: [
        { id: 1, row: 1, text: "Обновление", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateMenu", 0), disabled: false },
        { id: 2, row: 1, text: "Статистика", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateMenu", 1), disabled: false },
        { id: 3, row: 1, text: "Алист", action: () => window.sendChatInput(`/alist ${window.interface("AdminSpectate").player.id}`), disabled: false },
        { id: 4, row: 1, text: "Спавн", action: () => window.sendChatInput(`/spawn ${window.interface("AdminSpectate").player.id}`), disabled: false },
        { id: 5, row: 1, text: "Вверх", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateMenu", 4), disabled: false },
        { id: 6, row: 1, text: "Вниз", action: () => window.sendChatInput(`/slap ${window.interface("AdminSpectate").player.id} -`), disabled: false },
        { id: 7, row: 1, text: "Флип", action: () => window.sendChatInput(`/tflip ${window.interface("AdminSpectate").player.id}`), disabled: false },
        { id: 8, row: 1, text: "Тп игрока", action: () => window.sendChatInput(`/gethere ${window.interface("AdminSpectate").player.id}`), disabled: false },
        { id: 9, row: 1, text: "Тс тп", action: () => window.sendChatInput(`/tpcar ${window.interface("AdminSpectate").player.id}`), disabled: false },
        { id: 10, row: 1, text: "На дорогу", action: () => window.sendChatInput(`/tpr ${window.interface("AdminSpectate").player.id}`), disabled: false },
        { id: 11, row: 1, text: "Фикс", action: () => window.sendChatInput(`/fix ${window.interface("AdminSpectate").player.id}`), disabled: false },
        { id: 12, row: 1, text: "Вы тут", action: () => window.sendChatInput(`/pm ${window.interface("AdminSpectate").player.id} Вы тут? Двигайтесь или /n Я тут`), disabled: false },
        { id: 13, row: 1, text: "ПМИ", action: () => window.sendChatInput(`/pmn ${window.interface("AdminSpectate").player.id} Проверка на бота, двигаетесь или напишите в чат или в репорт /report "Я тут"`), disabled: false },
        { id: 14, row: 1, text: "Следить", action: () => window.sendChatInput(`/pm ${window.interface("AdminSpectate").player.id} Здравствуйте, начал следить за данным игроком.`), disabled: false },
        { id: 15, row: 2, text: "Все", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateTab", 0), disabled: false },
        { id: 16, row: 2, text: "Случ", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateTab", 1), disabled: false },
        { id: 17, row: 2, text: "Рабоч", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateTab", 2), disabled: false },
        { id: 18, row: 2, text: "Маф", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateTab", 3), disabled: false },
        { id: 19, row: 2, text: "Капт", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateTab", 4), disabled: false },
        { id: 20, row: 2, text: "Гос", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateTab", 5), disabled: false },
        { id: 21, row: 2, text: "Нов", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateTab", 6), disabled: false },
        { id: 22, row: 2, text: "Выход", action: () => window.sendClientEvent(gm.EVENT_EXECUTE_PUBLIC, "OnSelectSpectateMenu", 6), disabled: false },
    ],

     icons: [
        {
            title: "sp",
            id: undefined,
            icon: 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBVcGxvYWRlZCB0bzogU1ZHIFJlcG8sIHd3dy5zdmdyZXBvLmNvbSwgR2VuZXJhdG9yOiBTVkcgUmVwbyBNaXhlciBUb29scyAtLT4NCjxzdmcgZmlsbD0iI2ZmZmZmZiIgaGVpZ2h0PSI4MDBweCIgd2lkdGg9IjgwMHB4IiB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiANCgkgdmlld0JveD0iMCAwIDUxMS45OTkgNTExLjk5OSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTI1NS45OTgsMjE0Ljc4N2MtMjIuNzI0LDAtNDEuMjEyc0E4LjQ4OC00MS4yMTIsNDEuMjEyLTQxLjIxMnM0MS4yMTIsMTguNDg4LDQxLjIxMi00MS4yMTINCgkJCVMyNzguNzIzLDIxNC43ODcsMjU1Ljk5OCwyMTQuNzg3eiIvPg0KCTwvZz4NCjwvZz4NCjxnPg0KCTxnPg0KCQk8cGF0aCBkPSJNNTA3LjgzNiwyNDQuOTEyYy0xLjE0Ny0xLjMxMi0yOC41OTYtMzIuNTAyLTcyLjk5OC02My45M2MtNTkuNDg3LTQyLjEwNS0xMjEuMzI5LTY0LjM2Mi0xNzguODQtNjQuMzYyDQoJCQljLTU3LjUxLDAtMTE5LjM1MiwyMi4yNTYtMTc4LjgzOSw2NC4zNjJDMzIuNzU4LDIxMi40MSw1LjMwOCwyNDMuNiw0LjE2MiwyNDQuOTEyYy01LjU0OSw2LjM1LTUuNTQ5LDE1LjgyNCwwLDIyLjE3NA0KCQkJYzEuMTQ3LDEuMzEyLDI4LjU5NiwzMi41MDIsNzIuOTk4LDYzLjkzMWM1OS40ODcsNDIuMTA1LDEyMS4zMjksNjQuMzYyLDE3OC44MzksNjQuMzYyYzU3LjUxMSwwLDExOS4zNTMtMjIuMjU2LDE3OC44NC02NC4zNjINCgkJCWM0NC40MDItMzEuNDI4LDcxLjg1Mi02Mi42MTgsNzIuOTk4LTYzLjkzMUM1MTMuMzg2LDI2MC43MzcsNTEzLjM4NiwyNTEuMjYyLDUwNy44MzYsMjQ0LjkxMnogTTI1NS45OTcsMzUwLjM2NQ0KCQkJYy01Mi4wMzIsMC05NC4zNjUtNDIuMzMyLTk0LjM2NS05NC4zNjZzNDIuMzMyLTk0LjM2Niw5NC4zNjUtOTQuMzY2YzUyLjAzNiwwLDk0LjM2Nyw0Mi4zMzIsOTQuMzY3LDk0LjM2Ng0KCQkJUzMwOC4wMzMsMzUwLjM2NSwyNTUuOTk3LDM1MC4zNjV6Ii8+DQoJPC9nPg0KPC9zdmc+'
        }
    ]

};