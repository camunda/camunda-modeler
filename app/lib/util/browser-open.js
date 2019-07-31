/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { shell } = require('electron');

module.exports = function(url) {

  // as a security best practice, prevent opening of non-url links
  if (!/^https?:\/\//.test(url)) {
    return;
  }

  return shell.openExternal(url);
};
