import { InterfaceManager } from './core/InterfaceManager';
import { load } from './core/Loader';
InterfaceManager.executeFunctionWhen(() => {
    InterfaceManager.init();
    load.start();
}, () => window.App !== undefined && window.interface("Hud") !== false && !!window.interface("Hud").$refs.chat);