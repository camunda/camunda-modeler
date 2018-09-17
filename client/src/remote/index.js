import { electronRequire } from './electron';

import Backend from './Backend';
import Dialog from './Dialog';
import FileSystem from './FileSystem';
import Workspace from './Workspace';

export const ipcRenderer = electronRequire('ipcRenderer');

export const backend = new Backend(ipcRenderer);

export const fileSystem = new FileSystem(backend);

export const dialog = new Dialog(backend);

export const workspace = new Workspace(backend);