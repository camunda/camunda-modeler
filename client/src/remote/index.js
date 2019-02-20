/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { electronRequire } from './electron';

import Backend from './Backend';
import Config from './Config';
import Dialog from './Dialog';
import FileSystem from './FileSystem';
import Log from './Log';
import Plugins from './Plugins';
import Workspace from './Workspace';

const {
  app,
  getGlobal,
  process
} = electronRequire('remote');

const platform = process.platform;

export const ipcRenderer = electronRequire('ipcRenderer');

export const backend = new Backend(ipcRenderer, platform);

export const fileSystem = new FileSystem(backend);

export const config = new Config(backend);

export const dialog = new Dialog(backend);

export const plugins = new Plugins(app);

export const metadata = getGlobal('metaData');

export const flags = app.flags.getAll();

export const workspace = new Workspace(backend);

export const log = new Log(backend);
