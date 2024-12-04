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
  }

  /**
   * @param {string} path
   */
  async open(path) {
    try {
      const file = await this._app.getGlobal('fileSystem').readFile(path);

      this._processApplication = this._createFromFile(file);
    } catch (err) {
      console.error(err);
    }

    this._app.emit('process-applications:changed');
  }

  _createFromFile(file) {
    return {
      ...JSON.parse(file.contents),
      file
    };
  }

  get() {
    return this._processApplication;
  }
}