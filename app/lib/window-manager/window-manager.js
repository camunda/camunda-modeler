/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * @typedef Bounds
 * @property {number} height
 * @property {number} width
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef WindowConfig
 * @property {Bounds} bounds
 * @property {boolean} fullScreen
 * @property {boolean} maximize
 */

/** @type WindowConfig */
const DEFAULT_CONFIG = {
  bounds: {
    height: 600,
    width: 800,
    x: 0,
    y: 0
  },
  maximize: false,
  fullScreen: false
};

const UPDATE_EVENTS = [
  'maximize',
  'unmaximize',
  'move',
  'resize',
  'enter-full-screen',
  'leave-full-screen',
  'close'
];


module.exports = class WindowManager {
  constructor({ config, electronScreen }) {
    this.config = config;
    this.screen = electronScreen;
    this.state = null;
  }

  /**
   * Set window size and fullScreen from config and set up listeners.
   * @param {import('electron').BrowserWindow} window
   */
  manage(window) {
    const config = this.config.get('window') || {};

    const bounds = { ...DEFAULT_CONFIG.bounds, ...config.bounds },
          maximize = !!config.maximize,
          fullScreen = !!config.fullScreen;

    const displays = this.screen.getAllDisplays();

    if (displays.some(display => isWithinBounds(bounds, display.bounds))) {
      window.setBounds(bounds);
    } else {
      window.setSize(bounds.width, bounds.height);
    }

    if (maximize) {
      window.maximize();
    }

    if (fullScreen) {
      window.setFullScreen(true);
    }

    this.setState({ bounds, fullScreen, maximize });

    this.setupListeners(window);
  }

  setupListeners(window) {
    const updateState = () => {
      const fullScreen = window.isFullScreen(),
            maximize = window.isMaximized(),
            bounds = window.getBounds();

      this.setState({
        fullScreen,
        maximize,
        bounds
      });
    };

    const handleClosed = () => {
      UPDATE_EVENTS.forEach(event => {
        window.off(event, updateState);
      });

      this.setWindowConfig(this.state);
    };

    UPDATE_EVENTS.forEach(event => {
      window.on(event, updateState);
    });

    window.once('closed', handleClosed);
  }

  setState(newState) {
    this.state = newState;
  }

  setWindowConfig(newConfig) {
    this.config.set('window', newConfig);
  }
};



// helper ////
function isWithinBounds(bounds, targetBounds) {
  return (
    bounds.x >= targetBounds.x &&
    bounds.y >= targetBounds.y &&
    bounds.x + bounds.width <= targetBounds.x + targetBounds.width &&
    bounds.y + bounds.height <= targetBounds.y + targetBounds.height
  );
}
