import { electronRequire } from './electron';

import Backend from './Backend';


export const ipcRenderer = electronRequire('ipcRenderer');

export const backend = new Backend(ipcRenderer);