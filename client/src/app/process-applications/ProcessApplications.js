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

      if (activeTab && activeTab.file) {
        const { file } = activeTab;

        const item = this._items.find(item => item.file.path === file.path);

        if (item && item.metadata.processApplication) {
          this.open(item.metadata.processApplication);
        }
      }
    });

    this._app.on('app.activeTabChanged', ({ activeTab }) => {
      const { file } = activeTab;

      const item = this._items.find(item => item.file.path === file.path);

      if (!item || !item.metadata.processApplication) {
        this._processApplication && this.close();

        return;
      }

      const { metadata } = item;

      if (metadata.processApplication) {
        this.open(metadata.processApplication);
      }
    });

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

      this._app.getGlobal('backend').send('file-context:add-root', dirname);

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
    this._app.getGlobal('backend').send('file-context:remove-root', this._processApplication.file.dirname);

    this._processApplication = null;

    this._app.emit('process-applications:changed');
  }

  getOpen() {
    return this._processApplication;
  }

  hasOpen() {
    return !!this._processApplication;
  }

  getItems() {
    if (!this._processApplication) {
      return [];
    }

    const items = this._items.filter(({ metadata }) => metadata.processApplication === this._processApplication.file.path);

    return items;
  }
}