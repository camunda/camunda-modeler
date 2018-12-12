import { electronRequire } from './electron';

import Backend from './Backend';
import Config from './Config';
import Dialog from './Dialog';
import FileSystem from './FileSystem';
import Workspace from './Workspace';

export const ipcRenderer = electronRequire('ipcRenderer');

export const { process } = electronRequire('remote');

export const backend = new Backend(ipcRenderer, process);

export const fileSystem = new FileSystem(backend);

export const config = new Config(backend);

export const dialog = new Dialog(backend);

export const workspace = new Workspace(backend);
