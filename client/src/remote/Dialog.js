/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { assign } from 'min-dash';

export default class Dialog {

  constructor(backend) {
    this.backend = backend;

    this._openDialogs = 0;
  }

  /**
   * Whether a modal dialog opened by the application is currently visible.
   *
   * Used to tell an application-triggered window focus / blur (a dialog we
   * opened grabbing or releasing focus) apart from the user actually leaving
   * or returning to the app from the outside.
   *
   * @returns {boolean}
   */
  isDialogOpen() {
    return this._openDialogs > 0;
  }

  /**
   * Send a dialog request to the backend while tracking it as an open modal
   * dialog, so window focus / blur it causes is not mistaken for the user
   * switching away from or back to the application.
   *
   * @param {string} channel
   * @param {Object} [options]
   *
   * @returns {Promise}
   */
  _send(channel, options) {
    this._openDialogs++;

    // defer the send into the promise chain so a synchronous throw (e.g. a
    // disallowed backend event) still settles through `finally` and never
    // leaves the counter stuck, permanently suppressing focus / blur handling
    return Promise.resolve()
      .then(() => this.backend.send(channel, options))
      .finally(() => {
        this._openDialogs--;
      });
  }

  /**
   * Show open dialog.
   *
   * @param {Object} options Options.
   * @param {string} options.defaultPath Default path.
   * @param {Object} options.filters Extension filters.
   * @param {string} [options.title] Dialog title.
   *
   * @returns {Promise}
   */
  showOpenFilesDialog(options) {
    return this._send('dialog:open-files', options);
  }

  /**
   * Shows dialog with error.
   *
   * @param {Object} options - Options.
   * @param {Object} [options.detail] - Detail.
   * @param {Object} [options.message] - Message.
   * @param {Object} [options.name] - Name.
   *
   * @return {Promise}
   */
  showOpenFileErrorDialog = async (options) => {
    return this._send('dialog:open-file-error', options);
  };

  /**
   * Show save dialog.
   *
   * @param {Object} options Options.
   * @param {string} [options.defaultPath] Default path.
   * @param {Object} [options.filters] Extension filters.
   * @param {string} [options.title] Dialog title.
   *
   * @returns {Promise}
   */
  showSaveFileDialog(options) {
    return this._send('dialog:save-file', options);
  }

  /**
   * Show file explorer dialog.
   *
   * @param {Object} options Options.
   * @param {string} [options.path] Path where to open the file explorer.
   *
   * @returns {Promise}
   */
  showFileExplorerDialog(options) {
    return this._send('dialog:open-file-explorer', options);
  }

  /**
   * Show save error dialog.
   *
   * @param {Object} options - Options.
   * @param {Object} [options.buttons] - Buttons.
   * @param {string} [options.message] - Error message.
   * @param {string} [options.title] - Title.
   */
  showSaveFileErrorDialog(options) {
    return this.show(assign(options, {
      type: 'error'
    }));
  }

  /**
   * Shows a dialog that can e configured.
   *
   * @param {Object} options - Options.
   * @param {Array} [options.buttons] - Buttons.
   * @param {string} [options.detail] - detail.
   * @param {string} [options.message] - Message.
   * @param {string} [options.title] - Title.
   * @param {string} options.type - Type (info, warning, error, question).
   *
   * @returns {Promise}
   */
  show(options) {
    return this._send('dialog:show', options);
  }

  /**
   * Shows dialog asking the user to either save or discard changes before closing.
   *
   * @param {Object} options - Options.
   * @param {string} [options.name] - Name.
   *
   * @returns {Promise}
   */
  showCloseFileDialog(options) {
    const {
      name
    } = options;

    const isLinux = this.backend.getPlatform() == 'linux';

    const buttons = [
      { id: 'save', label: 'Save' },
      { id: 'discard', label: 'Don\'t Save' },
      { id: 'cancel', label: 'Cancel' },
    ];

    // Re-order buttons for linux
    if (isLinux) {
      buttons.push(buttons.shift());
    }

    return this.show({
      buttons,
      defaultId: isLinux ? 2 : 0,
      message: `Save changes to "${ name }" before closing?`,
      type: 'question',
      title: 'Close File'
    });
  }

  /**
   * Shows dialog asking the user to create a new file.
   *
   * @param {Object} options - Options.
   * @param {string} options.file - path to the file
   * @param {string} options.type - Filetype.
   */
  showEmptyFileDialog = async (options) => {
    const {
      file,
      type
    } = options;

    const typeUpperCase = type.toUpperCase();

    const isLinux = this.backend.getPlatform() == 'linux';

    const buttons = [
      { id: 'create', label: 'Create' },
      { id: 'cancel', label: 'Cancel' }
    ];

    // Re-order buttons for linux
    if (isLinux) {
      buttons.push(buttons.shift());
    }

    return this.show({
      buttons,
      defaultId: isLinux ? 1 : 0,
      detail: `Would you like to create a new ${ typeUpperCase } file?`,
      message: `The file "${ file.name }" is empty.`,
      title: [
        'Empty ',
        typeUpperCase,
        ' file'
      ].join(''),
      type: 'info'
    });
  };

  /**
   * Shows dialog asking user for confirmation to reload the modeler.
  */
  showReloadDialog() {
    const isLinux = this.backend.getPlatform() == 'linux';

    const buttons = [
      { id: 'save', label: 'Save' },
      { id: 'reload', label: 'Continue without saving' },
      { id: 'cancel', label: 'Cancel' },
    ];

    // Re-order buttons for linux
    if (isLinux) {
      buttons.push(buttons.shift());
    }

    return this.show({
      buttons,
      defaultId: isLinux ? 2 : 0,
      message: 'Reloading the modeler will discard all unsaved changes. Do you want to save before reloading?',
      type: 'question',
      title: 'Reload Modeler'
    });
  }


}
