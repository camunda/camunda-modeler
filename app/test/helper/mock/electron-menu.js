/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';


/**
 * Simple mock of electron's <Menu> module
 */
class ElectronMenu extends Array {
  static buildFromTemplate(menuTemplate) {
    return menuTemplate;
  }

  static setApplicationMenu(menu) {
    this.menu = menu;
  }

  append(item) {
    this.push(item);
  }
}

module.exports = ElectronMenu;
