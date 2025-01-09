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
 * @typedef { import('./types').AutoCompletion } AutoCompletion
 */

export default class AutoCompletions {
  constructor(processApplications) {
    this._processApplications = processApplications;
  }

  /**
   *
   * @param {string} value
   * @param {string} type
   *
   * @returns {Array<AutoCompletion>}
   */
  get(value, type) {
    const items = this._processApplications.getItems().filter(item => item.type !== 'processApplication');

    return items
      .filter(item => item.metadata.type === type)
      .reduce((autoCompletions, item) => {
        const { metadata } = item;

        const { ids } = metadata;

        return [
          ...autoCompletions,
          ...ids
            .filter(id => id.includes(value))
            .map(id => createAutoCompletion(item, id))
        ];
      }, []);
  }
};

/**
 * @param {IndexItem} item
 * @param {string} value
 *
 * @returns {AutoCompletion}
 */
function createAutoCompletion(item, value) {
  return {
    uri: item.file.uri,
    value
  };
}