/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const glob = require('glob');
const parents = require('parents');
const path = require('path');

const { isArray } = require('min-dash');

const log = require('../../log')('app:config:element-templates');


/**
 * Get element templates.
 */
class ElementTemplatesProvider {
  constructor(paths, defaultProvider) {
    this._paths = paths;
    this._defaultProvider = defaultProvider;
  }

  /**
   * Get element templates for file.
   *
   * @param {string} _
   * @param {File} file
   *
   * @returns {Array<Template>}
   */
  get(_, file) {
    const localPaths = file && file.path ? parents(file.path) : [];

    const paths = [
      ...suffixAll(localPaths, '.camunda'),
      ...this._paths
    ];

    return [
      ...getTemplates(paths),
      ...this._defaultProvider.get('elementTemplates', [])
    ];
  }
}

module.exports = ElementTemplatesProvider;


// helpers //////////

/**
 * Suffix all paths.
 *
 * @param {Array<string>} paths
 * @param {string} suffix
 *
 * @returns {Array<string>}
 */
function suffixAll(paths, suffix) {
  return paths.map(p => path.join(p, suffix));
}

/**
 * Get element templates.
 *
 * @param  {Array<string>} paths
 *
 * @return {Array<Template>}
 */
function getTemplates(paths) {
  return paths.reduce((templates, path) => {
    let files;

    // do not throw if file not accessible or no such file
    try {
      files = globTemplates(path);
    } catch (error) {
      log.error(`templates ${ path } glob error`, error);

      return templates;
    }

    return [
      ...templates,
      ...getTemplatesForPaths(files)
    ];
  }, []);
}

/**
 * Get element templates from paths.
 *
 * @param  {Array<string>} paths
 *
 * @return {Array<Template>}
 */
function getTemplatesForPaths(paths) {
  return paths.reduce((templates, path) => {
    return [
      ...templates,
      ...getTemplatesForPath(path)
    ];
  }, []);
}

/**
 * Get element templates from paths.
 *
 * @param  {string} path
 *
 * @return {Array<Template>}
 */
function getTemplatesForPath(path) {
  let templates;

  try {
    templates = JSON.parse(fs.readFileSync(path, 'utf8'));

    if (!isArray(templates)) {
      templates = [ templates ];
    }

    return templates;
  } catch (error) {
    log.error(`template ${ path } parse error`, error);

    throw new Error(`template ${ path } parse error: ${ error.message }`);
  }
}

/**
 * Glob element templates from `<path>/resources`.
 *
 * @param {string} path
 *
 * @return {Array<string>}
 */
function globTemplates(path) {
  const globOptions = {
    cwd: path,
    nodir: true,
    realpath: true
  };

  return glob.sync('element-templates/**/*.json', globOptions);
}