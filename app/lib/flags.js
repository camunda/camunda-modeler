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
  globJSON
} = require('./util/files');

const log = require('./log')('app:flags');

const FLAGS_PATTERN = 'flags.json';


class Flags {

  constructor(options) {

    const searchPaths = options.paths || [];
    const overrides = options.overrides || {};

    log.info('searching for %s in paths %O', FLAGS_PATTERN, searchPaths);

    const {
      config,
      files,
      errors
    } = globJSON({
      searchPaths,
      pattern: FLAGS_PATTERN
    });

    log.info('found %O', files);

    if (errors.length) {
      log.error('skipped files due to errors', errors);
    }

    this.flags = {
      ...config,
      ...overrides
    };

    log.info('active %o', this.flags);
  }

  getAll() {
    return this.flags;
  }

  get(key, defaultValue) {
    return key in this.flags ? this.flags[key] : defaultValue;
  }

}

module.exports = Flags;
