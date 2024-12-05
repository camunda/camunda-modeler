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
    this._files = [];
  }

  /**
   * @param {string} path
   */
  async open(path) {
    try {
      const file = await this._app.getGlobal('fileSystem').readFile(path);

      const {
        contents,
        dirname
      } = file;

      this._cancelOnFilesUpdated = this._app.getGlobal('backend').on('file-context:files-updated', this._onFilesUpdated);

      this._app.getGlobal('backend').send('file-context:add-root', `file://${dirname}`);

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
    if (this._onFilesUpdated) {
      this._cancelOnFilesUpdated();

      this._cancelOnFilesUpdated = null;
    }

    this._app.getGlobal('backend').send('file-context:remove-root', `file://${this._processApplication.file.dirname}`);

    this._processApplication = null;

    this._app.emit('process-applications:changed');
  }

  _onFilesUpdated = (_, files) => {
    debugger;
  };

  getOpen() {
    return this._processApplication;
  }

  hasOpen() {
    return !!this._processApplication;
  }

  getFiles() {
    return this._files;
  }
}