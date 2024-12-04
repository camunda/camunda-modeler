/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { EventEmitter } from 'node:events';

import Indexer from './indexer.js';
import Processor from './processor.js';
import Watcher from './watcher.js';
import Workqueue from './workqueue.js';

/**
 * @typedef { import('./types').Processor } Processor
 * @typedef { {
 *   watch: boolean;
 *   processors: Processor[];
 * } } FileContextOptions
 */

const DEFAULT_OPTIONS = {
  watch: true,
  processors: [
    {
      extensions: [ '.bpmn', '.xml' ],
      process: async (item) => {
        return item;
      }
    },
    {
      extensions: [ '.dmn' ],
      process: async (item) => {
        return item;
      }
    },
    {
      extensions: [ '.form' ],
      process: async (item) => {
        return item;
      }
    }
  ]
};

/**
 * File context that indexes and processes files.
 */
export default class FileContext extends EventEmitter {

  /**
   * @param {import('./types.js').Logger} logger
   * @param {FileContextOptions} [options]
   */
  constructor(logger, options = DEFAULT_OPTIONS) {
    super();

    const { processors } = options;

    this._logger = logger;

    this._workqueue = new Workqueue(this);
    this._processor = new Processor(logger, processors);
    this._indexer = new Indexer(logger, this, this._processor, this._workqueue);

    this._init(options);
  }

  /**
   * Add root
   *
   * @param { string } uri
   */
  addRoot(uri) {
    return this._indexer.addRoot(uri);
  }

  /**
   * Remove root
   *
   * @param { string } uri
   */
  removeRoot(uri) {
    return this._indexer.removeRoot(uri);
  }

  /**
   * Add file
   *
   * @param {string} uri
   */
  addFile(uri) {
    return this._indexer.add(uri);
  }

  /**
   * Notify file changed
   *
   * @param {string} uri
   */
  updateFile(uri) {
    return this.addFile(uri);
  }

  /**
   * Remove file
   *
   * @param {string} uri
   */
  removeFile(uri) {
    return this._indexer.remove(uri);
  }

  /**
   * Notify file opened
   *
   * @param { { uri: string, value: string } } fileProps
   */
  fileOpened(fileProps) {
    return this._indexer.fileOpened(fileProps);
  }

  /**
   * Notify file content changed
   *
   * @param { { uri: string, value: string } } fileProps
   */
  fileContentChanged(fileProps) {
    return this._indexer.fileContentChanged(fileProps);
  }

  /**
   * Notify file closed
   *
   * @param { string } uri
   */
  fileClosed(uri) {
    return this._indexer.fileClosed(uri);
  }

  /**
   * @return { Promise<Void> }
   */
  close() {

    if (this._watcher) {
      return this._watcher.close();
    }

    return Promise.resolve();
  }

  /**
   * @param {FileContextOptions} options
   */
  _init(options = {}) {
    const {
      processors,
      watch = true
    } = options;

    if (watch) {
      this._watcher = new Watcher(this._logger, this, processors);

      this.once('watcher:ready', () => {
        this.once('workqueue:empty', () => this.emit('ready'));
      });
    } else {
      this.once('workqueue:empty', () => this.emit('ready'));
    }
  }

}
