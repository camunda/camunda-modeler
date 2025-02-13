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
 * @typedef { import('./types').IndexItem } IndexItem
 */

const fs = require('fs');

const { createFile, readFile } = require('../file-system');

const {
  toFilePath,
  toFileUrl
} = require('./util');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

module.exports = class Indexer {

  /**
   * @type { Set<string> }
   */
  roots = new Set();

  /**
   * @type { Map<string, IndexItem> }
   */
  items = new Map();

  /**
   * @param { import('./types').Logger } logger
   * @param { import('node:events').EventEmitter } eventBus
   * @param { import('./processor').default } processor
   * @param { import('./workqueue').default } workqueue
   */
  constructor(logger, eventBus, processor, workqueue) {

    this._logger = logger;
    this._eventBus = eventBus;
    this._processor = processor;
    this._workqueue = workqueue;

    eventBus.on('watcher:add', (uri) => {
      this.add(uri);
    });

    eventBus.on('watcher:change', (uri) => {
      this.fileUpdated(uri);
    });

    eventBus.on('watcher:remove', (uri) => {
      this.remove(uri);
    });
  }

  on(event, callback) {
    this._eventBus.on('indexer:' + event, callback);
  }

  once(event, callback) {
    this._eventBus.once('indexer:' + event, callback);
  }

  _emit(event, ...args) {
    this._eventBus.emit('indexer:' + event, ...args);
  }

  /**
   * Add root
   *
   * @param { string } uri
   */
  addRoot(uri) {
    this.roots.add(toFileUrl(uri));

    this._emit('roots:add', uri);
  }

  /**
   * Remove root
   *
   * @param { string } uri
   */
  removeRoot(uri) {
    this.roots.delete(toFileUrl(uri));

    this._emit('roots:remove', uri);
  }

  /**
   * @return { string[] } roots
   */
  getRoots() {
    return Array.from(this.roots);
  }

  /**
   * @param { string } uri
   * @param { { processor?: string } } [options]
   *
   * @returns { Promise<undefined> }
   */
  add(uri, options = {}) {
    uri = toFileUrl(uri);

    const { processor } = options;

    this._logger.info('indexer:add', uri, processor);

    let indexItem = this.items.get(uri);

    if (!indexItem) {
      indexItem = createIndexItem({ uri, processor });

      this.items.set(uri, indexItem);
    }

    indexItem._read = undefined;

    indexItem._process = undefined;

    return this._parseItem(indexItem);
  }

  /**
   * Notify file opened
   *
   * @param { string } uri
   * @param { { processor?: string } } [options]
   *
   * @returns { Promise<undefined> }
   */
  fileOpened(uri, options = {}) {
    this._emit('file-opened', uri);

    return this.add(toFileUrl(uri), options);
  }

  /**
   * Notify file updated
   *
   * @param { string } uri
   * @param { { processor?: string } } [options]
   *
   * @returns { Promise<undefined> }
   */
  fileUpdated(uri, options = {}) {
    this._emit('file-updated', uri);

    return this.add(toFileUrl(uri), options);
  }

  /**
   * Notify file closed
   *
   * @param {string} uri
   */
  fileClosed(uri) {
    this._emit('file-closed', uri);

    this.remove(toFileUrl(uri), true);
  }

  /**
   * @param {string} uri
   */
  remove(uri) {
    uri = toFileUrl(uri);

    this._logger.info('indexer:remove', uri);

    const item = this.items.get(uri);

    if (!item) {
      return;
    }

    this.items.delete(uri);

    return this._removed(item);
  }

  /**
   * @internal
   *
   * @param {IndexItem} item
   */
  async _parseItem(item) {

    let {
      _read,
      _process,
      _parsed
    } = item;

    if (!_read) {
      this._logger.info('indexer:reading item ' + item.uri);

      _read = item._read = () => this._readItem(item);
      _parsed = null;
    }

    if (!_process) {
      this._logger.info('indexer:processing item ' + item.uri);

      _process = item._process = () => this._processItem(item);
      _parsed = null;
    }

    if (!_parsed) {
      _parsed = item._parsed = _read().then(_process).then((item) => {
        this._updated(item);

        return item;
      }, err => {
        this._logger.error('indexer:failed to parse item ' + item.uri, err);

        throw err;
      });
    }

    return this._queue(_parsed);
  }

  /**
   * @internal
   *
   * @param {IndexItem} item
   *
   * @return {Promise<IndexItem>}
   */
  async _readItem(item) {

    let file;

    try {
      const stats = fs.statSync(toFilePath(item.uri));

      if (stats.size > MAX_FILE_SIZE) {
        throw new Error('File size exceeds limit of ' + MAX_FILE_SIZE + ' bytes');
      }

      file = readFile(toFilePath(item.uri), 'utf8');

      removeMessage(file, 'read-error');
    } catch (err) {
      this._logger.error('indexer:failed to read item ' + item.uri, err);

      file = createFile({
        path: toFilePath(item.uri),
        contents: null,
      });

      addMessage(file, err.message, 'read-error', true);
    }

    item.file = file;

    return item;
  }

  /**
   * @internal
   *
   * @param { IndexItem } item
   *
   * @return { Promise<IndexItem> }
   */
  async _processItem(item) {
    if (item.error) {
      item.metadata = null;

      return item;
    }

    try {
      item.metadata = await this._processor.process(item);

      removeMessage(item.file, 'process-error');
    } catch (err) {
      this._logger.error('indexer:failed to process item ' + item.uri, err);

      item.metadata = null;

      addMessage(item.file, err.message, 'process-error', true);
    }

    return item;
  }

  /**
   * @internal
   *
   * @template T
   *
   * @param {Promise<T>} value
   *
   * @return {Promise<T>}
   */
  _queue(value) {
    return this._workqueue.add(value);
  }

  /**
   * @internal
   *
   * @param {IndexItem} item
   */
  _updated(item) {
    this._logger.info('indexer:updated', item.uri);

    this._emit('updated', item);
  }

  /**
   * @internal
   *
   * @param {IndexItem} item
   */
  _removed(item) {
    this._emit('removed', item);
  }

  /**
   * Get item with the given uri
   *
   * @param {string} uri
   *
   * @return { Promise<IndexItem> }
   */
  async get(uri) {

    const item = this.items.get(toFileUrl(uri));

    if (!item) {
      return null;
    }

    return this._parseItem(item);
  }

  /**
   * Return known index items.
   *
   * @return { IndexItem[] }
   */
  getItems() {
    return Array.from(this.items.values());
  }

};

/**
 * @param { {
 *  uri: string,
 *  processor?: string
 * } } item
 *
 * @return {IndexItem}
 */
function createIndexItem(item) {

  const {
    uri,
    processor,
    ...rest
  } = item;

  const file = createFile({
    path: toFilePath(uri),
    contents: ''
  });

  return {
    ...rest,
    uri,
    processor,
    file
  };

}

function addMessage(file, message, source, error = false) {
  removeMessage(file, source);

  file.messages = [
    ...(file.messages || []),
    {
      error,
      message,
      source
    }
  ];
}

function removeMessage(file, source) {
  file.messages = (file.messages || []).filter(message => message.source !== source);
}