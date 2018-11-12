'use strict';

const proxyquire = require('proxyquire');

const ElectronApp = require('../../helper/mock/electron-app');
const ElectronMenu = require('../../helper/mock/electron-menu');
const ElectronMenuItem = require('../../helper/mock/electron-menu-item');

const Electron = {
  app: ElectronApp,
  Menu: ElectronMenu,
  MenuItem: ElectronMenuItem
};

const MenuBuilder = proxyquire('../../../lib/menu/menu-builder.js', {
  electron: Electron
});


describe('MenuBuilder', () => {

  it('should instantiate', () => {
    const menuBuilder = new MenuBuilder();

    expect(menuBuilder).to.exist;
  });


  it('should build menu', () => {
    const menuBuilder = new MenuBuilder();

    const menu = menuBuilder.build();

    expect(menu).to.exist;
  });


  it('should build context menu', () => {
    const menuBuilder = new MenuBuilder({ type: 'tab' });

    const contextMenu = menuBuilder.buildContextMenu();

    expect(contextMenu).to.exist;
  });

});
