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

const fs = require('fs');
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
        this.setDefaultPath(filePath);
      }

      return filePath;
    });
  }

  showOpenDialog(options) {
    const {
      filters,
      properties,
      title
    } = options;

    let { defaultPath } = options;

    if (!defaultPath) {
      defaultPath = this.config.get('defaultPath', this.userDesktopPath);
    }

    return this.electronDialog.showOpenDialog(this.browserWindow, {
      defaultPath,
      filters,
      properties: properties || [ 'openFile', 'multiSelections' ],
      title: title || 'Open File'
    }).then(response => {

      const {
        filePaths
      } = response;

      if (filePaths && filePaths[0]) {
        this.setDefaultPath(filePaths);
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
   * Set the default path for file dialogs. The provided path may be a file path
   * or a directory path, therefore the following rules apply:
   *
   *  1. If it is a file path, the directory of the file will be used as the
   *     default path.
   *  2. If it is a file path, but the file does not exist (e.g. when saving a
   *     new file), the directory path of the file will be used as the default
   *     path.
   *  3. If it is a directory path, that directory will be used as the default
   *     path.
   *
   * @param {string|Array<string>} fileOrDirectoryPaths - Path(s) to a file or
   * directory. If an array is provided, only the first path is used.
   */
  setDefaultPath(fileOrDirectoryPaths) {
    let fileOrDirectoryPath = fileOrDirectoryPaths;

    if (Array.isArray(fileOrDirectoryPaths)) {
      fileOrDirectoryPath = fileOrDirectoryPaths[0];
    }

    if (this.defaultPath && this.defaultPath === fileOrDirectoryPath) {
      return;
    }

    let defaultPath = null;

    try {
      const filePathExists = fs.existsSync(fileOrDirectoryPath);

      if (filePathExists) {
        const stats = fs.statSync(fileOrDirectoryPath);

        if (stats.isFile()) {
          defaultPath = path.dirname(fileOrDirectoryPath);
        } else if (stats.isDirectory()) {
          defaultPath = fileOrDirectoryPath;
        }
      } else {
        const dirPathExists = fs.existsSync(path.dirname(fileOrDirectoryPath));

        if (dirPathExists) {
          defaultPath = path.dirname(fileOrDirectoryPath);
        }
      }
    } catch (err) {
      log.error('Error setting default path', err);

      return;
    }

    if (!defaultPath) {
      log.warn('Error setting default path, neither file nor directory exists', fileOrDirectoryPath);

      return;
    }

    log.debug('set', { defaultPath });

    this.config.set('defaultPath', defaultPath);

    this.defaultPath = defaultPath;
  }

  setActiveWindow(browserWindow) {
    this.browserWindow = browserWindow;
  }
}

module.exports = Dialog;
