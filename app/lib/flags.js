const {
  globJSON
} = require('./util/files');

const log = require('debug')('app:flags');
const logError = require('debug')('app:flags:error');

const FLAGS_PATTERN = 'flags.json';


class Flags {

  constructor(options) {

    const searchPaths = options.paths || [];
    const overrides = options.overrides || {};

    log('searching for %s in paths %o', FLAGS_PATTERN, searchPaths);

    const {
      config,
      files,
      errors
    } = globJSON({
      searchPaths,
      pattern: FLAGS_PATTERN
    });

    log('found %o', files);

    if (errors.length) {
      logError('skipped files due to errors', errors);
    }

    this.flags = {
      ...config,
      ...overrides
    };
  }

  getAll() {
    return this.flags;
  }
}

module.exports = Flags;