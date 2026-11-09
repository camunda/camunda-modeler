/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { EventEmitter } = require('node:events');

const path = require('node:path');

const {
  getFileExtension,
  getFileName,
  toFilePath,
  toFileUrl
} = require('./util');

const { isCamundaProjectFile } = require('./processors/util');

const Indexer = require('./indexer.js');
const Processor = require('./processor.js');
const Watcher = require('./watcher.js');
const Workqueue = require('./workqueue.js');

/**
 * @typedef { import('./types').Processor } Processor
 * @typedef { {
 *   watch: boolean;
 *   processors: Processor[];
 * } } FileContextOptions
 */

const DEFAULT_PROCESSORS = require('./processors');

const DEFAULT_OPTIONS = {
  watch: true,
  processors: DEFAULT_PROCESSORS
};

const PROJECT_REFRESH_DELAY = 300;

// batches files indexed in a row, e.g. on startup
const PROJECT_REFRESH_DELAY_INDEXED = 50;

/**
 * File context that indexes and processes files.
 */
module.exports = class FileContext extends EventEmitter {

  /**
   * @param { import('./types').Logger } logger
   * @param { FileContextOptions } [options]
   */
  constructor(logger, options = DEFAULT_OPTIONS) {
    super();

    const { processors } = options;

    this._logger = logger;
    this._processors = processors;

    this._workqueue = new Workqueue(this);
    this._processor = new Processor(logger, processors);
    this._indexer = new Indexer(logger, this, this._processor, this._workqueue);

    this._init(options);
  }

  /**
   * Add root.
   *
   * @param { string } uri
   */
  addRoot(uri) {
    return this._indexer.addRoot(toFileUrl(uri));
  }

  /**
   * Remove root.
   *
   * @param { string } uri
   */
  removeRoot(uri) {
    return this._indexer.removeRoot(toFileUrl(uri));
  }

  /**
   * Add file.
   *
   * @param { string } uri
   * @param { { localValue?: string, processor?: string } } [options]
   *
   * @returns { Promise<undefined> }
   */
  addFile(uri, options) {
    return this._indexer.add(toFileUrl(uri), options);
  }

  /**
   * Remove file.
   *
   * @param { string } uri
   *
   * @returns { undefined }
   */
  removeFile(uri) {
    return this._indexer.remove(toFileUrl(uri));
  }

  /**
   * Handle file opened.
   *
   * @param { string } uri
   * @param { { processor?: string } }
   *
   * @returns { Promise<undefined> }
   */
  fileOpened(uri, options) {
    return this._indexer.fileOpened(uri, options);
  }

  /**
   * Handle file updated.
   *
   * @param { string } uri
   * @param { { processor?: string } } [options]
   */
  fileUpdated(uri, options) {
    return this._indexer.fileUpdated(uri, options);
  }

  /**
   * Handle file closed.
   *
   * @param { string } uri
   */
  fileClosed(uri) {
    return this._indexer.fileClosed(toFileUrl(uri));
  }

  /**
   * Reset the file context, removing all roots and indexed files.
   */
  reset() {
    this._indexer.getRoots().forEach(uri => this.removeRoot(uri));

    this._indexer.removeAll();
  }

  /**
   * @return { Promise<undefined> }
   */
  close() {
    clearTimeout(this._projectRefreshTimer);

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

    this.on('workqueue:empty', () => this._logger.info('workqueue:empty'));

    this._changedPaths = new Set();

    // project resources indexed explicitly, as the watcher does not discover them
    this._projectResourceUris = new Set();

    // indexed files checked against project resources once
    this._checkedUris = new Set();

    this.on('indexer:updated', (item) => {
      if (item.metadata && item.metadata.resources) {
        this._indexProjectResources();
      } else {
        this._refreshProjectsForItem(item);
      }
    });

    this.on('indexer:removed', (item) => {
      this._checkedUris.delete(item.uri);
    });

    this.on('watcher:fs-change', (uri) => {
      this._changedPaths.add(toFilePath(uri));

      this._scheduleProjectRefresh(PROJECT_REFRESH_DELAY);
    });
  }

  /**
   * Re-resolve projects soon for a file indexed below them but not resolved
   * as their resource yet, e.g. a file just saved into the project, without
   * waiting for the file system change.
   *
   * @param { import('./types').IndexItem } item
   */
  _refreshProjectsForItem(item) {
    if (this._checkedUris.has(item.uri)) {
      return;
    }

    this._checkedUris.add(item.uri);

    const filePath = item.file.path;

    const projectItems = this._indexer.getItems().filter(projectItem => {
      const resources = projectItem.metadata && projectItem.metadata.resources;

      return resources
        && filePath.startsWith(path.dirname(projectItem.file.path) + path.sep)
        && !resources.selected.includes(filePath);
    });

    if (!projectItems.length) {
      return;
    }

    this._changedPaths.add(filePath);

    this._scheduleProjectRefresh(PROJECT_REFRESH_DELAY_INDEXED);
  }

  /**
   * @param { number } delay
   */
  _scheduleProjectRefresh(delay) {
    clearTimeout(this._projectRefreshTimer);

    this._projectRefreshTimer = setTimeout(() => this._refreshProjects(), delay);
  }

  /**
   * Index project resources the watcher does not discover, e.g. below
   * `node_modules` or behind directory links, so that they take part in
   * editor intelligence. Stop indexing those no longer selected.
   */
  _indexProjectResources() {
    const items = this._indexer.getItems();

    const selected = new Set(items.flatMap(item => {
      const resources = item.metadata && item.metadata.resources;

      return resources ? resources.selected : [];
    }));

    const watchedFiles = this._watcher ? this._watcher.getFiles() : [];

    for (const uri of this._projectResourceUris) {
      const filePath = toFilePath(uri);

      if (!selected.has(filePath) && !watchedFiles.includes(filePath)) {
        this._projectResourceUris.delete(uri);
        this._indexer.remove(uri);
      }
    }

    for (const filePath of selected) {
      const uri = toFileUrl(filePath);

      if (this._indexer.items.has(uri) || !this._isIndexable(filePath)) {
        continue;
      }

      this._projectResourceUris.add(uri);
      this._indexer.add(uri);
    }
  }

  /**
   * @param { string } filePath
   *
   * @return { boolean }
   */
  _isIndexable(filePath) {
    if (isCamundaProjectFile(filePath)) {
      return false;
    }

    return (this._processors || []).some(processor => {
      return processor.extensions.includes(getFileExtension(filePath))
        || (processor.fileNames || []).includes(getFileName(filePath));
    });
  }

  /**
   * Re-resolve the resources of Camunda projects affected by file system
   * changes, i.e. files added, removed or `.c8ignore` changed below them.
   *
   * @return { Promise<undefined> }
   */
  _refreshProjects() {
    const changedPaths = Array.from(this._changedPaths);

    this._changedPaths.clear();

    const projectItems = this._indexer.getItems().filter(item => {
      const { path: filePath } = item.file;

      if (!isCamundaProjectFile(filePath)) {
        return false;
      }

      const projectRoot = path.dirname(filePath);

      return changedPaths.some(changedPath => {

        // changes of the project file itself are handled by the indexer
        return changedPath !== filePath && changedPath.startsWith(projectRoot + path.sep);
      });
    });

    return Promise.all(projectItems.map(item => this._indexer.add(item.uri)));
  }

};