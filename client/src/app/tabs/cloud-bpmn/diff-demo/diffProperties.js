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
 * @typedef { {
 *   type: 'added'|'changed'|'removed',
 *   key: string,
 *   path?: Array<string|number>,
 *   parentPath?: Array<string|number>,
 *   property?: string,
 *   oldValue?: any,
 *   newValue?: any,
 *   item?: Object,
 *   collectionPath?: Array<string|number>,
 *   index?: number
 * } } PropertyChange
 *
 * Property changes come in two shapes:
 *
 * - value changes: `path` (in the new tree) of the changed property, with
 *   `parentPath`, `property`, `oldValue` and `newValue`
 * - list item changes: `item` added (at `path`) or removed (from
 *   `collectionPath` at original `index`)
 *
 * `key` identifies a change independent of list positions, e.g. to
 * remember approved changes across recomputations.
 */

// not part of an element's properties, or covered by other elements
const IGNORED_PROPERTIES = [
  'id',
  'di',
  'incoming',
  'outgoing',
  'flowElements',
  'artifacts',
  'laneSets',
  'lanes',
  'participants',
  'messageFlows',
  'rootElements',
  'diagrams'
];

/**
 * List items rendered as such in the properties panel, matched by key
 * rather than by position.
 */
export const LIST_ITEM_KEYS = {
  'zeebe:Input': item => item.get('target'),
  'zeebe:Output': item => item.get('target'),
  'zeebe:Header': item => item.get('key'),
  'zeebe:Property': item => item.get('name'),
  'zeebe:ExecutionListener': item => `${ item.get('eventType') }:${ item.get('type') }`,
  'zeebe:TaskListener': item => `${ item.get('eventType') }:${ item.get('type') }`
};

/**
 * PROTOTYPE: compute property changes between two versions of the same
 * element (business object), e.g. parsed from the original XML and the
 * current model.
 *
 * Child flow elements, references and DI are ignored.
 *
 * @param {Object} oldNode
 * @param {Object} newNode
 *
 * @return {Array<PropertyChange>}
 */
export function diffProperties(oldNode, newNode) {
  const changes = [];

  walk(oldNode, newNode, [], [], changes);

  return changes;
}

function walk(oldNode, newNode, path, keyPath, changes) {
  const node = newNode || oldNode;

  for (const property of node.$descriptor.properties) {
    const { name, isMany, isReference, isVirtual } = property;

    if (isVirtual || isReference || IGNORED_PROPERTIES.includes(name)) {
      continue;
    }

    const oldValue = oldNode ? oldNode[ name ] : undefined;
    const newValue = newNode ? newNode[ name ] : undefined;

    if (isMany) {
      diffCollection(node, name, oldValue || [], newValue || [], path, keyPath, changes);
    } else if (isModdle(oldValue) || isModdle(newValue)) {
      if (isModdle(oldValue) && isModdle(newValue) && oldValue.$type !== newValue.$type) {
        changes.push({
          type: 'changed',
          key: getChangeKey([ ...keyPath, name ], 'changed', newValue.$type),
          path: [ ...path, name ],
          parentPath: path,
          property: name,
          oldValue,
          newValue
        });
      } else {
        walk(oldValue, newValue, [ ...path, name ], [ ...keyPath, name ], changes);
      }
    } else {
      diffValue(name, oldValue, newValue, path, keyPath, changes);
    }
  }
}

function diffValue(property, oldValue, newValue, parentPath, keyPath, changes) {
  if (isEmpty(oldValue) && isEmpty(newValue)) {
    return;
  }

  if (oldValue === newValue) {
    return;
  }

  const type = isEmpty(oldValue) ? 'added' : isEmpty(newValue) ? 'removed' : 'changed';

  changes.push({
    type,
    key: getChangeKey([ ...keyPath, property ], type, newValue),
    path: [ ...parentPath, property ],
    parentPath,
    property,
    oldValue,
    newValue
  });
}

function diffCollection(owner, name, oldList, newList, path, keyPath, changes) {
  const collectionPath = [ ...path, name ];
  const collectionKeyPath = [ ...keyPath, name ];

  // primitive collections are compared as a whole
  if (![ ...oldList, ...newList ].every(isModdle)) {
    if (JSON.stringify(oldList) !== JSON.stringify(newList)) {
      changes.push({
        type: 'changed',
        key: getChangeKey(collectionKeyPath, 'changed', newList),
        path: collectionPath,
        parentPath: path,
        property: name,
        oldValue: oldList,
        newValue: newList
      });
    }

    return;
  }

  // extension elements are containers (e.g. zeebe:IoMapping), not list items
  // in the properties panel; diff their content rather than the containers
  const flatten = owner.$instanceOf && owner.$instanceOf('bpmn:ExtensionElements');

  const oldKeys = getKeys(oldList, flatten);
  const newKeys = getKeys(newList, flatten);

  newList.forEach((newItem, newIndex) => {
    const oldIndex = oldKeys.indexOf(newKeys[ newIndex ]);

    const itemPath = [ ...collectionPath, newIndex ];
    const itemKeyPath = [ ...collectionKeyPath, newKeys[ newIndex ] ];

    if (oldIndex !== -1) {
      walk(oldList[ oldIndex ], newItem, itemPath, itemKeyPath, changes);
    } else if (flatten) {
      walk(null, newItem, itemPath, itemKeyPath, changes);
    } else {
      changes.push({
        type: 'added',
        key: getChangeKey(itemKeyPath, 'added', JSON.stringify(newItem)),
        path: itemPath,
        collectionPath,
        item: newItem,
        index: newIndex
      });
    }
  });

  oldList.forEach((oldItem, oldIndex) => {
    if (newKeys.includes(oldKeys[ oldIndex ])) {
      return;
    }

    if (flatten) {

      // prototype: removed containers are reported via their content, which
      // cannot be located in the new tree anymore
      walk(oldItem, null, [ ...collectionPath, null ], [ ...collectionKeyPath, oldKeys[ oldIndex ] ], changes);
    } else {
      changes.push({
        type: 'removed',
        key: getChangeKey([ ...collectionKeyPath, oldKeys[ oldIndex ] ], 'removed', JSON.stringify(oldItem)),
        collectionPath,
        item: oldItem,
        index: oldIndex
      });
    }
  });
}

/**
 * Keys to match list items by, unique within the list.
 */
function getKeys(list, flatten) {
  const seen = {};

  return list.map((item, index) => {
    const getKey = LIST_ITEM_KEYS[ item.$type ];

    let key;

    if (getKey) {
      key = `key:${ item.$type }:${ getKey(item) }`;
    } else if (item.id) {
      key = `id:${ item.id }`;
    } else if (flatten) {
      key = `type:${ item.$type }`;
    } else {
      key = `index:${ index }`;
    }

    seen[ key ] = (seen[ key ] || 0) + 1;

    return seen[ key ] > 1 ? `${ key }#${ seen[ key ] }` : key;
  });
}

/**
 * Includes the new value, so a change approved for one value shows up again
 * once the property changes to another value.
 */
function getChangeKey(keyPath, type, newValue) {
  const value = isModdle(newValue) ? newValue.$type : newValue;

  return `${ keyPath.join('/') }|${ type }|${ JSON.stringify(value === undefined ? null : value) }`;
}

function isModdle(value) {
  return !!(value && value.$descriptor);
}

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}
