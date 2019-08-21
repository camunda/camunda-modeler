/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');

const path = require('path');

module.exports = function(electronApp, menuState) {
  var file = fs.readFileSync(path.resolve(__dirname, './assets/logo-template.svg'), 'utf8');

  file = file.replace('{version}', electronApp.version);

  fs.writeFileSync(path.resolve(__dirname, './assets/logo.svg'), file, 'utf8');

  return [
    {
      label: 'Non-existing action',
      action: function() {
        electronApp.emit('menu:action', 'nonExistingAction');
      }
    }
  ];
};