'use strict';

const { app } = require('electron');

const { assign } = require('min-dash');

const DefaultMenuBuilder = require('./menu-builder');

const renderer = require('../util/renderer');

const requirePlatform = require('../util/require-platform');


class Menu {
  constructor(platform, plugins) {
    const MenuBuilder = this.MenuBuilder = requirePlatform(platform, __dirname, DefaultMenuBuilder);

    // replace Electron default menu until application loads
    new MenuBuilder().build();

    // keep the last state cached to be used by the context menu
    this.__cachedState = null;

    // handle menu actions
    // make sure there is active client before sending action
    app.on('menu:action', function(action, options) {
      if (app.mainWindow) {
        return renderer.send('menu:action', action, options);
      }

      app.once('app:client-ready', function() {
        renderer.send('menu:action', action);
      });

      app.createEditorWindow();
    });

    // rebuild default menu on window closing while app is still running
    app.on('window-all-closed', function() {
      new MenuBuilder({
        plugins: plugins
      }).build();
    });

    function rebuildMenu(state) {
      const mainWindow = app.mainWindow;

      if (!state.hasOwnProperty('devtools') && mainWindow) {
        const isDevToolsOpened = mainWindow.isDevToolsOpened();
        state = assign(state, { devtools: isDevToolsOpened });
      }

      // rebuild main application menu
      new MenuBuilder({
        state: state,
        plugins: plugins
      }).build();

      this.__cachedState = state;
    }

    // handle state updates from client
    renderer.on('menu:update', rebuildMenu, this);

    // handle DevTools opening/closing specific state
    app.on('menu:update', rebuildMenu, this);

    // handle context menu trigger from client
    renderer.on('context-menu:open', function(type, attrs) {
      const state = this.__cachedState;
      const contextMenu = new MenuBuilder({
        state: state,
        plugins: plugins
      }).buildContextMenu(type, attrs);

      // don't open a context menu if no type has been provided
      if (!contextMenu) {
        return;
      }

      contextMenu.openPopup();
    }, this);
  }

  rebuild() {
    const MenuBuilder = this.MenuBuilder;

    new MenuBuilder().build();
  }
}

module.exports = Menu;
