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

const path = require('path');

const ensureOptions = require('./util/ensure-opts');

const { assign } = require('min-dash');

const log = require('./log')('app:dialog');

/**
 * @typedef { import('electron').Dialog } ElectronDialog
 * @typedef { import('./config') } Config
 */

/**
 * A dialog utility
 */
class Dialog {

  /**
   * @param { {
   *   electronDialog: ElectronDialog,
   *   config: Config,
   *   userDesktopPath: string
   * } } options
   */
  constructor(options) {
    ensureOptions([ 'electronDialog', 'config', 'userDesktopPath' ], options);

    this.browserWindow = null;

    this.electronDialog = options.electronDialog;
    this.config = options.config;

    this.userDesktopPath = options.userDesktopPath;
  }

  showOpenFileErrorDialog(options) {
    const {
      detail,
      message,
      name
    } = options;

    return this.showDialog({
      type: 'error',
      title: 'File Open Error',
      buttons: [
        { id: 'cancel', label: 'Close' }
      ],
      message: message || `Unable to open "${ name }"`,
      detail
    });
  }

  showSaveDialog(options) {
    const {
      file,
      filters,
      title
    } = options;

    let { name } = file;

    // remove extension
    name = path.parse(name).name;

    // add default extension as specified by filter
    // this prevents users on Linux to run into export / save-as issues,
    // cf. https://github.com/camunda/camunda-modeler/issues/1699
    if (filters && filters[0] && filters[0].extensions && filters[0].extensions[0]) {
      name = name + '.' + filters[0].extensions[0];
    }

    let { defaultPath } = options;

    if (!defaultPath) {
      defaultPath = this.config.get('defaultPath', this.userDesktopPath);
    }

    return this.electronDialog.showSaveDialog(this.browserWindow, {
      defaultPath: `${ defaultPath }/${ name }`,
      filters,
      title: title || `Save "${ name }" as...`
    }).then(response => {

      const {
        filePath
      } = response;

      if (filePath) {
        this.setDefaultPath(path.dirname(filePath));
      }

      return filePath;
    });
  }

  showOpenDialog(options) {
    const {
      filters,
      properties = [ 'openFile', 'multiSelections' ],
      title
    } = options;

    let { defaultPath } = options;

    if (!defaultPath) {
      defaultPath = this.config.get('defaultPath', this.userDesktopPath);
    }

    return this.electronDialog.showOpenDialog(this.browserWindow, {
      defaultPath,
      filters,
      properties,
      title: title || 'Open File'
    }).then(response => {

      const {
        filePaths
      } = response;

      const defaultPath = filePaths && filePaths[0];

      if (defaultPath) {
        this.setDefaultPath(
          properties.includes('openFile') ? path.dirname(defaultPath) : defaultPath
        );
      }

      return filePaths || [];
    });
  }

  showDialog(options) {
    let { buttons } = options;

    if (buttons) {
      assign(options, {
        buttons: buttons.map(({ label }) => label)
      });
    } else {
      buttons = [ {
        id: 'close',
        label: 'Close'
      } ];

      assign(options, {
        buttons: [ 'Close' ]
      });
    }

    // see https://github.com/electron/electron/blob/master/docs/api/dialog.md
    assign(options, {
      noLink: true
    });

    return this.electronDialog.showMessageBox(
      this.browserWindow, options
    ).then(response => {
      return {
        ...response,
        button: buttons[ response.response ].id
      };
    });
  }

  /**
   * Set the default path for file dialogs.
   *
   * @param {string} defaultPath - path to be used for open / save dialogs
   */
  setDefaultPath(defaultPath) {

    log.debug('set', { defaultPath });

    this.config.set('defaultPath', defaultPath);

    this.defaultPath = defaultPath;
  }

  setActiveWindow(browserWindow) {
    this.browserWindow = browserWindow;
  }
}

module.exports = Dialog;
