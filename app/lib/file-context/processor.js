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
 * @typedef { import('./types.js').IndexItem } IndexItem
 */

const { getFileExtension } = require('./util');

module.exports = class Processor {

  constructor(logger, processors) {
    this._logger = logger;
    this._processors = processors;
  }

  /**
   *
   * @param {IndexItem} item
   *
   * @returns {Promise<IndexItem>}
   */
  process(item) {
    this._logger.info('processor:process', item);

    const processor = this._processors.find(processor => processor.extensions.includes(getFileExtension(item.file.path)));

    return processor.process(item);
  }
};