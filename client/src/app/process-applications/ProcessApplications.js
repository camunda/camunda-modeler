/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

export default class ProcessApplications {
  constructor(app) {
    this._app = app;

    this._processApplication = null;
    this._items = [];
  }

  /**
   * @param {string} path
   */
  async open(path) {
    if (this._processApplication) {
      this.close();
    }

    try {
      const file = await this._app.getGlobal('fileSystem').readFile(path);

      const {
        contents,
        dirname
      } = file;

      const { cancel } = this._app.getGlobal('backend').on('file-context:indexer-items-updated', this._onIndexerUpdated);

      this._cancelOnFilesUpdated = cancel;

      this._app.getGlobal('backend').send('file-context:add-root', dirname);

      this._items = await this._app.getGlobal('backend').send('file-context:indexer-get-items');

      this._processApplication = {
        file,
        ...JSON.parse(contents)
      };
    } catch (err) {
      console.error(err);
    }

    this._app.emit('process-applications:changed');
  }

  close() {
    if (this._onIndexerUpdated) {
      this._cancelOnFilesUpdated();

      this._cancelOnFilesUpdated = null;
    }

    this._app.getGlobal('backend').send('file-context:remove-root', this._processApplication.file.dirname);

    this._processApplication = null;

    this._app.emit('process-applications:changed');
  }

  _onIndexerUpdated = (_, items) => {
    this._items = items;

    this._app.emit('process-applications:changed');
  };

  getOpen() {
    return this._processApplication;
  }

  hasOpen() {
    return !!this._processApplication;
  }

  getItems() {
    return this._items;
  }
}