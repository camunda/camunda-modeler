/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Config from './remote/Config';
import Dialog from './remote/Dialog';
import FileSystem from './remote/FileSystem';
import Log from './remote/Log';
import Plugins from './remote/Plugins';
import SystemClipboard from './remote/SystemClipboard';
import Workspace from './remote/Workspace';
import ZeebeAPI from './remote/ZeebeAPI';

import Settings from './app/Settings';
import StartInstance from './app/zeebe/StartInstance';
import Deployment from './app/zeebe/Deployment';

const {
  metadata,
  flags,
  plugins: appPlugins,
  backend: appBackend
} = window.getAppPreload();

export const backend = appBackend;

export const config = new Config(backend);

export const settings = new Settings({
  config
});

export const dialog = new Dialog(backend);

export const fileSystem = new FileSystem(backend);

export const log = new Log(backend);

export const plugins = new Plugins(appPlugins);

export const systemClipboard = new SystemClipboard(backend);

export const workspace = new Workspace(backend);

export const zeebeAPI = new ZeebeAPI(backend);

export const deployment = new Deployment(config, zeebeAPI);

export const startInstance = new StartInstance(config, zeebeAPI);

export const isMac = backend.getPlatform() === 'darwin';

export {
  metadata,
  flags
};

export const globals = {
  backend,
  config,
  deployment,
  dialog,
  fileSystem,
  isMac,
  log,
  plugins,
  settings,
  startInstance,
  systemClipboard,
  workspace,
  zeebeAPI
};