/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const {
  remote,
  ipcRenderer
} = require('electron');

const {
  process,
  app
} = remote;

const {
  platform
} = process;

/* global window */

window.getAppPreload = function() {

  return {
    metadata: app.metadata,
    plugins: app.plugins.getAll(),
    flags: app.flags.getAll(),
    ipcRenderer,
    platform
  };

};
