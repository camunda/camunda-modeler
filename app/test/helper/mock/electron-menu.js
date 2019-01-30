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
