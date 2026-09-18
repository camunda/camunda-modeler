/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const {
  FSWatcher
} = require('chokidar');

const {
  getFileExtension,
  toFilePath,
  toFileUrl
} = require('./util');

/**
 * @typedef { import('./types').Processor } Processor
 */

module.exports = class Watcher {

  /**
   * @param { import('./types').Logger } logger
   * @param { import('node:events').EventEmitter } eventBus
   * @param { Processor[] } processors
   */
  constructor(logger, eventBus, processors) {

    this._logger = logger;
    this._eventBus = eventBus;

    const extensions = processors.flatMap(processor => processor.extensions);

    /**
     * @type { string[] }
     */
    this._roots = [];

    /**
     * @type {Set<string>}
     */
    this._files = new Set();

    this._logger.info('watcher:start');

    /**
     * @type { import('chokidar').FSWatcher }
     */
    this._chokidar = new FSWatcher({
      ignored: /\/(node_modules|\.git)\//i,
      atomic: 300,
      followSymlinks: false
    });

    this._chokidar.on('add', path => {
      if (!extensions.includes(getFileExtension(path))) {
        this._logger.info('watcher:ignore', path);

        return;
      }

      this._logger.info('watcher:add', path);

      this._files.add(path);

      this._emit('add', toFileUrl(path));

      this._changed();
    });

    this._chokidar.on('change', path => {
      if (!extensions.includes(getFileExtension(path))) {
        this._logger.info('watcher:ignore', path);

        return;
      }

      this._logger.info('watcher:change', path);

      this._files.add(path);

      this._emit('change', toFileUrl(path));

      this._changed();
    });

    this._chokidar.on('unlink', path => {
      this._emit('remove', toFileUrl(path));

      this._files.delete(path);

      this._changed();
    });

    /\*|watcher/.test(process.env.DEBUG) && this._chokidar.on('all', (event, arg0) => {
      this._logger.info(event, arg0);
    });

    this._chokidar.on('ready', () => {
      this._logger.info('watcher:ready');

      this._emit('ready');
    });

    eventBus.on('indexer:roots:add', (uri) => {
      this.addRoot(uri);
    });

    eventBus.on('indexer:roots:remove', (uri) => {
      this.removeRoot(uri);
    });
  }

  /**
   * @param { string } event
   *
   * @param { ...any[] } args
   */
  _emit(event, ...args) {
    this._eventBus.emit('watcher:' + event, ...args);
  }

  /**
   * @internal
   */
  _changed() {
    clearTimeout(this._changedTimer);

    this._changedTimer = setTimeout(() => {
      this._emit('changed');
    }, 300);
  }

  /**
   * @returns { string[] }
   */
  getFiles() {
    return Array.from(this._files);
  }

  /**
   * Add watched root directory.
   *
   * @param { string } uri
   */
  addRoot(uri) {
    this._logger.info('watcher:addRoot', uri);

    const path = toFilePath(uri);

    if (this._roots.includes(path)) {
      return;
    }

    this._roots.push(path);

    this._chokidar.add(path);
  }

  /**
   * Remove watched root directory.
   *
   * @param { string } uri
   */
  removeRoot(uri) {
    this._logger.info('watcher:removeFolder', uri);

    const path = toFilePath(uri);

    if (!this._roots.includes(path)) {
      return;
    }

    this._chokidar.unwatch(path);

    this._roots = this._roots.filter(p => p !== path);
  }

  close() {
    this._logger.info('watcher:close');

    return this._chokidar.close();
  }
};
