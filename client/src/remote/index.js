import { electronRequire } from './electron';

import Backend from './Backend';
import Dialog from './Dialog';
import FileSystem from './FileSystem';

export const ipcRenderer = electronRequire('ipcRenderer');

export const backend = new Backend(ipcRenderer);

export const fileSystem = new FileSystem(backend);

export const dialog = new Dialog(backend);