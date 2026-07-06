/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const log = require('./log')('app:open-file-handler');

/**
 * Handles opening of files, deferring the open until the client is ready.
 *
 * Deferred file paths are queued and deduplicated, so opening the same
 * path multiple times while the client is not ready only opens it once.
 *
 * @param { {
 *   app: any,
 *   readFile: (filePath: string) => any,
 *   onError: (filePath: string, error: Error) => void,
 *   onOpen: (files: any[]) => void
 * } } options
 */
module.exports = function OpenFileHandler(options) {
  const {
    app,
    readFile,
    onError,
    renderer
  } = options;

  const queued = [];

  app.on('app:client-ready', () => {
    drain();
  });

  /**
   * Open the given file paths, or queue them if the client is not ready.
   *
   * @param {string[]} filePaths
   */
  function open(filePaths) {
    if (!app.clientReady) {
      filePaths.forEach(filePath => {
        if (!queued.includes(filePath)) {
          queued.push(filePath);
          log.info('queued %s', filePath);
        }
      });

      return;
    }

    log.info('opening %O', filePaths);

    const files = filePaths.map(filePath => {
      try {
        return readFile(filePath);
      } catch (error) {
        log.error('failed to open %s', filePath, error);
        onError(filePath, error);
      }
    }).filter(file => file);

    renderer.send('client:open-files', files);
  }

  /**
   * Open all queued files, clearing the queue.
   */
  function drain() {
    if (queued.length) {
      log.info('draining queue %O', queued);
      open(queued.splice(0));
    }
  }

  return {
    open,
    drain
  };
};
