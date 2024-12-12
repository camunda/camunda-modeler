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

    this._app.getGlobal('backend').on('file-context:changed', (_, items) => {
      this._items = items;

      const activeTab = this._app.state.activeTab;

      if (this.hasOpen()) {
        this._processApplicationItems = this._items.filter(item => item.metadata.processApplication === this._processApplication.file.path);

        this._app.emit('process-applications:changed');
      } else if (activeTab) {
        const { file } = activeTab;

        if (!file) {
          return;
        }

        const item = this._items.find(item => item.file.path === file.path);

        if (item && item.metadata.processApplication) {
          this.open(item.metadata.processApplication);
        }
      }
    });

    this._app.on('app.activeTabChanged', ({ activeTab }) => {
      const { file } = activeTab;

      if (!file) {
        this.close();

        return;
      }

      const item = this._items.find(item => item.file.path === file.path);

      if (!item || !item.metadata.processApplication) {
        this._processApplication && this.close();

        return;
      }

      if (item.metadata.processApplication) {
        this.open(item.metadata.processApplication);
      }
    });

    this._processApplication = null;
    this._processApplicationItems = [];
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

      this._processApplication = {
        file,
        ...JSON.parse(contents)
      };

      this._processApplicationItems = [];

      this._app.getGlobal('backend').send('file-context:add-root', dirname);
    } catch (err) {
      console.error(err);
    }

    this._app.emit('process-applications:changed');
  }

  close() {
    this._app.getGlobal('backend').send('file-context:remove-root', this._processApplication.file.dirname);

    this._processApplication = null;
    this._processApplicationItems = [];

    this._app.emit('process-applications:changed');
  }

  getOpen() {
    return this._processApplication;
  }

  hasOpen() {
    return !!this._processApplication;
  }

  getItems() {
    return this._processApplicationItems;
  }

  getItem(path) {
    return this._processApplicationItems.find(item => item.file.path === path);
  }
}