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
const parents = require('parents');
const path = require('path');

const { isArray } = require('min-dash');

const { globFiles, toPosixPath } = require('../../util/files');

const log = require('../../log')('app:config:element-templates');

/**
 * @typedef {import('../../template-updater/types').Template} Template
 */

/**
 * Provides element templates for the `bpmn.elementTemplates` config key.
 *
 * Templates are collected from two independent sources and merged (not
 * prioritized - there is no "use B if A is missing" fallback):
 *
 * 1. file-based: JSON files globbed from `element-templates/**` under the
 *    application resources paths, plus `.camunda/element-templates`
 *    directories walked up from the opened file's location (local, per-project
 *    templates)
 * 2. config-based: the `elementTemplates` array read from `config.json` via the
 *    shared `DefaultProvider`. This is an extension hook for templates supplied
 *    through the app config rather than dropped as files; it defaults to `[]`,
 *    so it contributes nothing unless something populates that config key.
 */
class ElementTemplatesProvider {
  constructor(paths, ignoredPaths, defaultProvider) {
    this._paths = paths;
    this._ignoredPaths = ignoredPaths;
    this._defaultProvider = defaultProvider;

    /**
     * Cache of parsed templates, grouped per scope (globbed directory). The
     * outer map is keyed by the globbed directory; the inner map holds the
     * parsed templates per file, keyed by absolute path. Entries are reused as
     * long as the file's modification time is unchanged, so we don't re-read
     * and re-parse every template on each `get`.
     *
     * Grouping per scope means a `get` scoped to one file (whose globbed dirs
     * depend on that file's location) rebuilds only its own scopes, leaving the
     * cached templates of unrelated scopes untouched.
     *
     * @type {Map<string, Map<string, { mtimeMs: number | null, templates: Array<Template> }>>}
     */
    this._cache = new Map();
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
    const localPaths = file && file.path ? parents(path.dirname(file.path)) : [];

    const paths = [
      ...suffixAll(localPaths, '.camunda'),
      ...this._paths
    ];

    return [

      // retrieve templates, file-based
      ...this._getTemplates(paths),

      // legacy hook: merge templates configured in `config.json`
      // under `elementTemplates` key
      ...this._defaultProvider.get('elementTemplates', [])
    ];
  }

  /**
   * Get element templates for the given paths, reusing cached parses for files
   * whose modification time did not change.
   *
   * @param {Array<string>} paths
   *
   * @returns {Array<Template>}
   */
  _getTemplates(paths) {
    return paths.reduce((templates, path) => {
      let files;

      // do not throw if file not accessible or no such file
      try {
        files = globTemplates(path, this._ignoredPaths);
      } catch (error) {
        log.error(`templates ${ path } glob error`, error);

        return templates;
      }

      // cache per scope (globbed directory): re-globbing a directory rebuilds
      // its file set, so deleted/renamed files drop out - while directories
      // outside this get's scope keep their cache, so switching between
      // files/projects does not evict (and force re-parsing of) another
      // scope's templates.
      const cached = this._cache.get(path) || new Map();
      const scope = new Map();

      const scoped = files.reduce((templates, file) => {
        const entry = this._readTemplates(file, cached);

        scope.set(file, entry);

        return [
          ...templates,
          ...entry.templates
        ];
      }, templates);

      // only keep scopes that actually contain templates, so an empty (or
      // emptied) directory drops out of the cache rather than lingering
      if (scope.size) {
        this._cache.set(path, scope);
      } else {
        this._cache.delete(path);
      }

      return scoped;
    }, []);
  }

  /**
   * Read and parse templates for a single file, using the cached result when
   * the file's modification time is unchanged.
   *
   * @param {string} file
   * @param {Map<string, { mtimeMs: number | null, templates: Array<Template> }>} cache
   *   the scope cache to look the file up in
   *
   * @returns {{ mtimeMs: number | null, templates: Array<Template> }} `mtimeMs`
   *   is `null` when the file could not be stat-ed (glob→stat race)
   */
  _readTemplates(file, cache) {
    let mtimeMs;

    try {
      mtimeMs = fs.statSync(file).mtimeMs;
    } catch (error) {

      // the file vanished (or became inaccessible) between globbing and stat -
      // a rare, transient race. Skip it rather than failing the whole `get`
      // and hiding all templates; a genuine parse error of a readable file is
      // still surfaced by `getTemplatesForPath` below. Consistent with the
      // glob-level handling in `_getTemplates`.
      log.warn(`template ${ file } stat error, skipping`, error);

      return { mtimeMs: null, templates: [] };
    }

    const cached = cache.get(file);

    if (cached && cached.mtimeMs === mtimeMs) {
      return cached;
    }

    return { mtimeMs, templates: getTemplatesForPath(file) };
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
 * @param {Array<string>} ignoredPaths
 *
 * @return {Array<string>}
 */
function globTemplates(path, ignoredPaths) {
  return globFiles('element-templates/**/*.json', {
    cwd: path,
    dot: true,
    ignore: ignoredPaths.map(toPosixPath)
  });
}
