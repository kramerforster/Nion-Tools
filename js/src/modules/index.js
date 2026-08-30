import { Alist } from './Alist';
import { InterfaceSP } from './InterfaceSP';
import { Report } from './Report';
import { Copy } from './Copy';
import { Tp } from './Tp';
import { AutoHealth } from './AutoHealth';
import { initPlayers } from './Players';
import { filtersTab } from './filtersTab';
import { initCmds } from './Cmds';
import { AutoSP } from './AutoSP';
import { SpecTP } from './SpecTP';
export const Rest = () => {
    initCmds();
    initPlayers();
    filtersTab();
    AutoSP();
};

export const scripts = { Alist, InterfaceSP, Report, Copy, Tp, AutoHealth, SpecTP };