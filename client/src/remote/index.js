import { electronRequire } from './electron';

import Backend from './Backend';
import Config from './Config';
import Dialog from './Dialog';
import FileSystem from './FileSystem';
import Plugins from './Plugins';
import Workspace from './Workspace';

const {
  app,
  getGlobal,
  process
} = electronRequire('remote');

export const ipcRenderer = electronRequire('ipcRenderer');

export { process };

export const backend = new Backend(ipcRenderer, process);

export const fileSystem = new FileSystem(backend);

export const config = new Config(backend);

export const dialog = new Dialog(backend);

export const plugins = new Plugins(app);

export const metadata = getGlobal('metaData');

export const workspace = new Workspace(backend);
