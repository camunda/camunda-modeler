/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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

  get(key) {
    return this.flags[key];
  }

}

module.exports = Flags;