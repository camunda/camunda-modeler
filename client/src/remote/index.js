import { electronRequire } from './electron';

import Backend from './Backend';
import Dialog from './Dialog';

export const ipcRenderer = electronRequire('ipcRenderer');

export const backend = new Backend(ipcRenderer);

export const dialog = new Dialog(backend);