/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
