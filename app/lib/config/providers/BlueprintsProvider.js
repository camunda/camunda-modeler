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
const path = require('path');

const log = require('../../log')('app:config:blueprints');

/**
 * @typedef { {
 *   id: string,
 *   files: Array<{ name: string, contents: string }>
 * } } Blueprint
 */

/**
 * Provides the blueprints in `blueprints/<id>/` of the resources paths. A
 * blueprint is a directory of files. A directory in a later path replaces the
 * one with the same name in an earlier path.
 */
class BlueprintsProvider {
  constructor(paths) {
    this._paths = paths;
  }

  /**
   * @returns {Array<Blueprint>}
   */
  get() {
    const blueprints = new Map();

    for (const resourcesPath of this._paths) {
      for (const blueprint of readBlueprints(path.join(resourcesPath, 'blueprints'))) {
        blueprints.set(blueprint.id, blueprint);
      }
    }

    return [ ...blueprints.values() ];
  }
}

module.exports = BlueprintsProvider;


// helpers //////////

/**
 * @param {string} directory
 *
 * @returns {Array<Blueprint>}
 */
function readBlueprints(directory) {
  let entries;

  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    return [];
  }

  return entries
    .filter(entry => entry.isDirectory())
    .map(({ name: id }) => {
      try {
        return {
          id,
          files: readFiles(path.join(directory, id))
        };
      } catch (error) {
        log.error(`blueprint ${ id } in ${ directory } read error`, error);

        return null;
      }
    })
    .filter(Boolean);
}

/**
 * @param {string} directory
 *
 * @returns {Array<{ name: string, contents: string }>}
 */
function readFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile())
    .map(({ name }) => name)
    .sort()
    .map(name => ({
      name,
      contents: fs.readFileSync(path.join(directory, name), 'utf8')
    }));
}
