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
 * @typedef { import('./types').Logger } Logger
 * @typedef { import('./types').Metadata } Metadata
 * @typedef { import('./types').Processor } Processor
 */

const { getFileExtension } = require('./util');

module.exports = class Processor {

  /**
   * @param { Logger } logger
   * @param { Processor } processors
   */
  constructor(logger, processors) {
    this._logger = logger;
    this._processors = processors;
  }

  /**
   * Process item.
   *
   * @param { IndexItem } item
   *
   * @returns { Promise<Metadata> }
   */
  process(item) {
    this._logger.info('processor:process', item.uri);

    const processor = this._processors.find(processor => processor.extensions.includes(getFileExtension(item.file.path)));

    return processor.process(item);
  }
};