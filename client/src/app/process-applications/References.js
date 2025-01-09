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
 * @typedef { import('./types').Reference } Reference
 */

export default class References {
  constructor(processApplications) {
    this._processApplications = processApplications;
  }

  /**
   * Find references from resource with path.
   *
   * @param { string } path
   * @param { string } [id]
   *
   * @returns { Array<Reference> }
   */
  findReferencesFrom(path, id) {
    const items = this._processApplications.getItems().filter(item => item.type !== 'processApplication');

    const sourceItem = items.find(item => item.file.path === path);

    if (!sourceItem) {
      return [];
    }

    const { metadata } = sourceItem;

    let { linkedIds, type } = metadata;

    if (id) {
      linkedIds = linkedIds.filter(linkedId => linkedId.elementId === id);
    }

    if (type === 'processApplication') {
      throw new Error('Finding references for process applications is not supported.');
    }

    return linkedIds
      .reduce((references, linkedId) => {
        const reference = this.findReferenceById(sourceItem, linkedId);

        if (reference) {
          return [
            ...references,
            reference
          ];
        }

        return references;
      }, []);
  }

  /**
   * Find resource with by ID and type.
   *
   * @param { IndexItem } sourceItem
   * @param { import('./types').LinkedId } linkedId
   *
   * @returns { Reference }
   */
  findReferenceById(sourceItem, linkedId) {
    const items = this._processApplications.getItems().filter(item => item.type !== 'processApplication');

    const targetItem = items.find(item => item.metadata.type === linkedId.type && item.metadata.ids.includes(linkedId.linkedId));

    if (targetItem) {
      return createReference(sourceItem, targetItem, linkedId);
    }

    return null;
  }

  /**
   * Find references to resource with path.
   *
   * @param { string } path
   * @param { string } [id]
   *
   * @returns { Array<Reference> }
   */
  findReferencesTo(path, id) {
    let items = this._processApplications.getItems();

    const targetItem = items.find(item => item.file.path === path);

    if (!targetItem) {
      return [];
    }

    const { metadata } = targetItem;

    let { ids, type } = metadata;

    if (id) {
      ids = [ id ];
    }

    if (type === 'processApplication') {
      throw new Error('Finding references for process applications is not supported.');
    }

    return items
      .filter(item => item.metadata.type !== 'processApplication')
      .reduce((references, sourceItem) => {
        const linkedId = sourceItem.metadata.linkedIds.find(linkedId => linkedId.type === type && ids.includes(linkedId.linkedId));

        if (linkedId) {
          return [
            ...references,
            createReference(sourceItem, targetItem, linkedId)
          ];
        }

        return references;
      }, []);
  }
};

/**
 * @param {IndexItem} sourceItem
 * @param {IndexItem} targetItem
 * @param {LinkedId} linkedId
 *
 * @returns {Reference}
 */
function createReference(sourceItem, targetItem, linkedId) {
  return {
    source: {
      id: linkedId.elementId,
      type: sourceItem.metadata.type,
      uri: sourceItem.file.uri
    },
    target: {
      id: linkedId.linkedId,
      type: targetItem.metadata.type,
      uri: targetItem.file.uri
    }
  };
}