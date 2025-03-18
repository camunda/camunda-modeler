/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import Actions from './Actions';
import Config from './Config';
import Dialog from './Dialog';
import FileSystem from './FileSystem';
import Log from './Log';
import Plugins from './Plugins';
import SystemClipboard from './SystemClipboard';
import Workspace from './Workspace';
import ZeebeAPI from './ZeebeAPI';

const {
  metadata,
  flags,
  plugins: appPlugins,
  backend: appBackend
} = window.getAppPreload();

export const actions = new Actions();

export const backend = appBackend;

export const config = new Config(backend);

export const dialog = new Dialog(backend);

export const fileSystem = new FileSystem(backend);

export const log = new Log(backend);

export const plugins = new Plugins(appPlugins);

export const systemClipboard = new SystemClipboard(backend);

export const workspace = new Workspace(backend);

export const zeebeAPI = new ZeebeAPI(backend);

export {
  metadata,
  flags
};
