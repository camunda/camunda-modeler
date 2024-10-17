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

const proxyquire = require('proxyquire');
const sinon = require('sinon');

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


describe('MenuBuilder', function() {

  it('should instantiate', function() {
    const menuBuilder = new MenuBuilder();

    expect(menuBuilder).to.exist;
  });


  it('should build menu', function() {
    const menuBuilder = new MenuBuilder();

    const menu = menuBuilder.build();

    expect(menu).to.exist;
  });


  it('should build context menu', function() {
    const menuBuilder = new MenuBuilder({
      type: 'tab',
      attrs: {
        tabId: '123abc'
      },
      state: {
        tabs: [
          {
            id: '123abc',
            file: {
              path: null
            }
          }
        ]
      }
    });

    const contextMenu = menuBuilder.buildContextMenu();

    expect(contextMenu).to.exist;
    expectMenu(contextMenu, [
      'Close Tab',
      'Close All Tabs',
      'Close Other Tabs',
      undefined,
      'Reveal in File Explorer'
    ]);
  });


  describe('plugins menu', function() {

    it('should accept callable values for enabled', function() {

      // given
      const pluginName = 'test';
      const menuStub = sinon.stub().returns([
        {
          label: 'label',
          enabled: () => false
        }
      ]);

      const options = getOptionsWithPlugins([
        {
          name: pluginName,
          menu: menuStub
        }
      ]);

      const menuBuilder = new MenuBuilder(options);

      // when
      const { menu } = menuBuilder.build();

      // then
      const plugins = menu.find(item => item.label === 'Plugins');
      const pluginMenu = plugins.submenu.find(plugin => plugin.label === pluginName);

      expect(pluginMenu).to.exist;
      expect(pluginMenu.submenu).to.be.an('Array').and.have.lengthOf(1);
      expect(pluginMenu.submenu[0]).to.have.property('enabled').which.is.false;
    });


    it('should disable menu item if enable function returns falsy value', function() {

      // given
      const falsyValues = [
        false,
        0,
        '',
        null,
        undefined,
        NaN
      ];
      const pluginName = 'test';
      const menuStub = sinon.stub().returns(falsyValues.map(value => ({
        label: 'label',
        enabled: () => value
      })));

      const options = getOptionsWithPlugins([
        {
          name: pluginName,
          menu: menuStub
        }
      ]);

      const menuBuilder = new MenuBuilder(options);

      // when
      const { menu } = menuBuilder.build();

      // then
      const plugins = menu.find(item => item.label === 'Plugins');
      const pluginMenu = plugins.submenu.find(plugin => plugin.label === pluginName);

      expect(pluginMenu).to.exist;
      expect(pluginMenu.submenu).to.be.an('Array').and.have.lengthOf(falsyValues.length);

      for (const entry of pluginMenu.submenu) {
        expect(entry).to.have.property('enabled', false);
      }
    });


    it('should properly label plugin with error', function() {

      // given
      const pluginName = 'test';
      const expectedLabel = `${pluginName} <error>`;
      const menuStub = sinon.stub().throwsException();

      const options = getOptionsWithPlugins([
        {
          name: pluginName,
          error: true,
          menu: menuStub
        }
      ]);

      const menuBuilder = new MenuBuilder(options);

      // when
      const { menu } = menuBuilder.build();

      // then
      const plugins = menu.find(item => item.label === 'Plugins');
      const pluginMenu = plugins.submenu.find(plugin => plugin.label === expectedLabel);

      expect(pluginMenu).to.exist;
    });


    it('should accept non-callable values for enabled', function() {

      // given
      const pluginName = 'test';
      const menuStub = sinon.stub().returns([
        {
          label: 'label',
          enabled: false
        }
      ]);

      const options = getOptionsWithPlugins([
        {
          name: pluginName,
          menu: menuStub
        }
      ]);

      const menuBuilder = new MenuBuilder(options);

      // when
      const { menu } = menuBuilder.build();

      // then
      const plugins = menu.find(item => item.label === 'Plugins');
      const pluginMenu = plugins.submenu.find(plugin => plugin.label === pluginName);

      expect(pluginMenu).to.exist;
      expect(pluginMenu.submenu).to.be.an('Array').and.have.lengthOf(1);
      expect(pluginMenu.submenu[0]).to.have.property('enabled').which.is.false;
    });


    it('should properly handle plugin menu error', function() {

      // given
      const pluginName = 'test';
      const menuStub = sinon.stub().throwsException();

      const options = getOptionsWithPlugins([
        {
          name: pluginName,
          menu: menuStub
        }
      ]);

      const menuBuilder = new MenuBuilder(options);

      // then
      expect(() => menuBuilder.build(), 'Menu builder should build the menu').to.not.throw();
    });


    it('should properly handle plugin menu item action error', function() {

      // given
      const pluginName = 'test';
      const actionStub = sinon.stub().throwsException();
      const menuStub = sinon.stub().returns([
        {
          label: 'label',
          enabled: false,
          action: actionStub
        }
      ]);

      const options = getOptionsWithPlugins([
        {
          name: pluginName,
          menu: menuStub
        }
      ]);

      const menuBuilder = new MenuBuilder(options);

      // when
      const { menu } = menuBuilder.build();

      // then
      const plugins = menu.find(item => item.label === 'Plugins');
      const pluginMenu = plugins.submenu.find(plugin => plugin.label === pluginName);
      const { click: action } = pluginMenu.submenu[0];

      expect(action).to.exist;
      expect(() => callAction(action), 'Assigned action should handle the error').to.not.throw();
      expect(actionStub).to.be.called;
    });

  });


  describe('edit menu', function() {

    afterEach(function() {
      sinon.restore();
    });


    it('should call action when item is clicked', function() {

      // given
      const action = sinon.spy(ElectronApp, 'emit');
      const menuBuilder = new MenuBuilder({
        state: {
          editMenu: [ {
            label: 'label',
            enabled: true,
            action
          } ]
        }
      });

      // when
      const { menu } = menuBuilder.build();

      // then
      const editMenu = menu.find(item => item.label === 'Edit');
      const { click } = editMenu.submenu[0];

      expect(click).to.exist;

      callAction(click, {}, false);
      expect(action).to.have.been.calledOnce;
    });


    it('should call action when shortcut is used in a window', function() {

      // given
      const action = sinon.spy(ElectronApp, 'emit');
      const menuBuilder = new MenuBuilder({
        state: {
          editMenu: [ {
            label: 'label',
            enabled: true,
            action
          } ]
        }
      });

      // when
      const { menu } = menuBuilder.build();

      // then
      const editMenu = menu.find(item => item.label === 'Edit');
      const { click } = editMenu.submenu[0];

      expect(click).to.exist;

      callAction(click, {}, true);
      expect(action).to.have.been.calledOnce;
    });


    it('should inform about triggered by shortcut', function() {

      // given
      const action = sinon.spy(ElectronApp, 'emit');
      const menuBuilder = new MenuBuilder({
        state: {
          editMenu: [ {
            label: 'label',
            enabled: true,
            action
          } ]
        }
      });

      // when
      const { menu } = menuBuilder.build();

      // then
      const editMenu = menu.find(item => item.label === 'Edit');
      const { click } = editMenu.submenu[0];

      expect(click).to.exist;

      callAction(click, {}, true);

      const call = action.getCall(0).args[2];
      expect(call).to.eql({ triggeredByShortcut: true });
    });


    it('should inform about triggered by shortcut - sub menu', function() {

      // given
      const action = sinon.spy(ElectronApp, 'emit');
      const menuBuilder = new MenuBuilder({
        state: {
          editMenu: [ {
            submenu: [
              {
                label: 'label',
                enabled: true,
                action
              }
            ]
          } ]
        }
      });

      // when
      const { menu } = menuBuilder.build();

      // then
      const editMenu = menu.find(item => item.label === 'Edit');
      const { click } = editMenu.submenu[0].submenu[0];

      expect(click).to.exist;

      callAction(click, {}, true);

      const call = action.getCall(0).args[2];
      expect(call).to.eql({ triggeredByShortcut: true });
    });


    it('should NOT call action if triggered via shortcut with no browser window', function() {

      // given
      const action = sinon.spy(ElectronApp, 'emit');
      const menuBuilder = new MenuBuilder({
        state: {
          editMenu: [ {
            label: 'label',
            enabled: true,
            action
          } ]
        }
      });

      // when
      const { menu } = menuBuilder.build();

      // then
      const editMenu = menu.find(item => item.label === 'Edit');
      const { click } = editMenu.submenu[0];

      expect(click).to.exist;

      callAction(click, null, true);
      expect(action).not.to.have.been.called;
    });
  });


  describe('new file menu', function() {

    it('should separate by group', function() {

      // given
      const providers = [
        {
          helpMenu: [],
          newFileMenu: [ {
            label: 'foo',
            group: 'A',
          } ]
        },
        {
          helpMenu: [],
          newFileMenu: [ {
            label: 'bar',
            group: 'B',
          } ]
        },
      ];

      const menuBuilder = new MenuBuilder({ providers });

      // when
      const { menu } = menuBuilder.build();

      const editMenu = menu.find(item => item.label === 'File');
      const newFileMenu = editMenu.submenu.find(item => item.label === 'New File');

      /*
       * - group A item
       * - separator
       * - group B item
       * - separator
       * - open new file options ...
       */
      expect(newFileMenu.submenu.length).to.equal(5);
    });

  });


  describe('help menu', function() {

    it('should prevent duplicates', function() {

      // given
      const providers = [
        {
          newFileMenu: [],
          helpMenu: [
            {
              label: 'foo'
            },
            {
              label: 'bar'
            }
          ]
        },
        {
          newFileMenu: [],
          helpMenu: [
            {
              label: 'bar'
            },
            {
              label: 'foobar'
            }
          ]
        },
      ];

      const menuBuilder = new MenuBuilder({ providers });

      // when
      const { menu } = menuBuilder.build();

      const helpMenu = menu.find(item => item.label === 'Help');
      const barEntry = helpMenu.submenu.filter(menu => menu.label === 'bar');

      // then
      expect(barEntry).to.have.length(1);
    });
  });

});


// helper /////////

function getOptionsWithPlugins(plugins) {
  return {
    providers: {
      plugins: {
        helpMenu: [],
        newFileMenu: [],
        plugins,
      }
    }
  };
}

function callAction(fn, browserWindow = {}, triggeredByAccelerator = false) {
  if (browserWindow === null) {
    browserWindow = undefined;
  }

  return fn(null, browserWindow, { triggeredByAccelerator });
}

function expectMenu(actual, expected) {
  const menu = actual.menu.map(item => item.label);

  expect(menu).to.eql(expected);
}