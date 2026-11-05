/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

import { diffProperties, LIST_ITEM_KEYS } from './diffProperties';

import ImplementWithAiHandler from './ImplementWithAiHandler';

/**
 * @typedef { {
 *   id: string,
 *   type: 'added'|'changed'|'removed',
 *   entry?: string,
 *   ghost?: string,
 *   group?: string,
 *   groupLabel?: string,
 *   label: string,
 *   labelPrefix: string,
 *   oldValue?: any,
 *   restorable: boolean,
 *   records: Array<import('./diffProperties').PropertyChange>
 * } } Change
 *
 * A change of a properties panel entry (`entry`) or a removed list item
 * (`ghost`, rendered as placeholder), backed by one or more property changes
 * (`records`).
 */

export const GROUP_LABELS = {
  general: 'General',
  documentation: 'Documentation',
  taskDefinition: 'Task definition',
  inputs: 'Inputs',
  outputs: 'Outputs',
  headers: 'Headers',
  Zeebe__ExecutionListeners: 'Execution listeners',
  Zeebe__TaskListeners: 'Task listeners',
  Zeebe__ExtensionProperties: 'Extension properties'
};

const ITEMS = {
  'zeebe:Input': { label: 'Input', group: 'inputs' },
  'zeebe:Output': { label: 'Output', group: 'outputs' },
  'zeebe:Header': { label: 'Header', group: 'headers' },
  'zeebe:Property': { label: 'Property', group: 'Zeebe__ExtensionProperties' },
  'zeebe:ExecutionListener': { label: 'Execution listener', group: 'Zeebe__ExecutionListeners' },
  'zeebe:TaskListener': { label: 'Task listener', group: 'Zeebe__TaskListeners' }
};

// best guess of an entry's group; refined from the DOM once rendered
const ENTRY_GROUPS = [
  [ /-input-\d+/, 'inputs' ],
  [ /-output-\d+/, 'outputs' ],
  [ /-header-\d+/, 'headers' ],
  [ /-executionListener-\d+/, 'Zeebe__ExecutionListeners' ],
  [ /-taskListener-\d+/, 'Zeebe__TaskListeners' ],
  [ /-extensionProperty-\d+/, 'Zeebe__ExtensionProperties' ],
  [ /^taskDefinition/, 'taskDefinition' ],
  [ /^documentation$/, 'documentation' ],
  [ /^(id|name)$/, 'general' ]
];

/**
 * PROTOTYPE: computes changes between a baseline (the XML before
 * "Implement with AI") and the current diagram, mapped to properties panel
 * entries. Fires `diffDemo.setChanges` with `{ changes }`, keyed by element ID.
 */
export default function DiffDemoChanges(eventBus, injector, commandStack) {
  this._eventBus = eventBus;
  this._injector = injector;

  this._baseline = null;

  // keys of approved property changes, see diffProperties
  this._approved = new Set();

  commandStack.registerHandler('diffDemo.implementWithAi', ImplementWithAiHandler);

  // a different diagram was imported
  eventBus.on('import.done', () => {
    if (this._baseline) {
      this.clear();
    }
  });
}

DiffDemoChanges.$inject = [ 'eventBus', 'injector', 'commandStack' ];

/**
 * Snapshot the current diagram, let "AI" change the (first) task and show
 * the resulting changes.
 */
DiffDemoChanges.prototype.implementWithAi = async function() {
  const elementRegistry = this._injector.get('elementRegistry');

  const task = elementRegistry.get('Task_PrepareOrder') || elementRegistry.find(element => is(element, 'bpmn:Task'));

  if (!task) {
    return;
  }

  const { xml } = await this._injector.get('bpmnjs').saveXML();

  const { elementsById } = await this._injector.get('moddle').fromXML(xml);

  this._baseline = elementsById;
  this._approved.clear();

  this._injector.get('commandStack').execute('diffDemo.implementWithAi', { element: task });

  this._injector.get('selection').select(task);

  this.compute();
};

DiffDemoChanges.prototype.clear = function() {
  this._baseline = null;
  this._approved.clear();

  this._eventBus.fire('diffDemo.setChanges', { changes: null });
};

DiffDemoChanges.prototype.compute = function() {
  if (!this._baseline) {
    return this.clear();
  }

  const changes = {};

  this._injector.get('elementRegistry').forEach(element => {
    if (element.labelTarget || changes[ element.id ]) {
      return;
    }

    const businessObject = getBusinessObject(element);

    const oldBusinessObject = businessObject && this._baseline[ businessObject.id ];

    if (!oldBusinessObject || oldBusinessObject.$type !== businessObject.$type) {
      return;
    }

    const records = diffProperties(oldBusinessObject, businessObject)
      .filter(record => !this._approved.has(getApprovalKey(element, record)));

    if (records.length) {
      changes[ element.id ] = this._toChanges(element, records);
    }
  });

  this._eventBus.fire('diffDemo.setChanges', { changes });
};

/**
 * Map property changes to properties panel entries, one change per entry.
 *
 * @return {Array<Change>}
 */
DiffDemoChanges.prototype._toChanges = function(element, records) {
  const changesById = {};

  for (const record of records) {
    const change = this._toChange(element, record);

    const existing = changesById[ change.id ];

    if (existing) {
      existing.records.push(...change.records);
      existing.type = existing.type === change.type ? existing.type : 'changed';
      existing.oldValue = undefined;
      existing.restorable = existing.restorable || change.restorable;
    } else {
      changesById[ change.id ] = change;
    }
  }

  return Object.values(changesById);
};

DiffDemoChanges.prototype._toChange = function(element, record) {
  const { type } = record;

  const restorable = type !== 'added' && isRestorable(record);

  // removed list item: placeholder
  if (record.item && type === 'removed') {
    const item = ITEMS[ record.item.$type ] || { label: record.item.$type };
    const key = getItemKey(record.item);

    return {
      id: `ghost:${ record.collectionPath.join('.') }:${ key }`,
      type,
      ghost: key,
      group: item.group,
      label: `${ item.label }: ${ key }`,
      labelPrefix: '',
      restorable,
      records: [ record ]
    };
  }

  // added list item: the item (collapsible entry) itself
  if (record.item) {
    const item = ITEMS[ record.item.$type ] || { label: record.item.$type };
    const entry = this._getItemEntryId(element, record);

    return {
      id: entry || record.path.join('.'),
      type,
      entry,
      group: item.group,
      label: `${ item.label }: ${ getItemKey(record.item) }`,
      labelPrefix: '',
      restorable,
      records: [ record ]
    };
  }

  const entry = this._getEntryId(element, record.path);

  const labelPrefix = getItemLabelPrefix(getBusinessObject(element), record.path);

  return {
    id: entry || record.path.join('.'),
    type,
    entry,
    group: getEntryGroup(entry),
    label: labelPrefix + humanize(record.property),
    labelPrefix,
    oldValue: typeof record.oldValue === 'string' ? record.oldValue : undefined,
    restorable,
    records: [ record ]
  };
};

/**
 * Resolve the entry editing a property, falling back to parent paths (e.g.
 * `documentation[0].text` is edited by the `documentation` entry).
 */
DiffDemoChanges.prototype._getEntryId = function(element, path) {
  const propertiesPanel = this._injector.get('propertiesPanel', false);

  if (!propertiesPanel || path.includes(null)) {
    return null;
  }

  for (let end = path.length; end > 0; end--) {
    const subPath = path.slice(0, end);

    if (typeof subPath[ end - 1 ] !== 'string') {
      continue;
    }

    let entryId = null;

    try {
      entryId = propertiesPanel.getEntryId(element, subPath);
    } catch (error) {

      // ignore, not resolvable
    }

    if (entryId) {
      return entryId;
    }
  }

  // top-level properties (e.g. `name`) are rendered as entries of that ID
  return path.length === 1 ? path[ 0 ] : null;
};

/**
 * Resolve a list item's entry ID via one of its fields' entries.
 */
DiffDemoChanges.prototype._getItemEntryId = function(element, record) {
  for (const { name } of record.item.$descriptor.properties) {
    const entryId = this._getEntryId(element, [ ...record.path, name ]);

    if (entryId && entryId.endsWith(`-${ name }`) && entryId !== name) {
      return entryId.slice(0, -(name.length + 1));
    }
  }

  return null;
};

/**
 * Approve a change: keep it and stop showing it as a change.
 *
 * @param {Change} change
 * @param {Object} element
 */
DiffDemoChanges.prototype.approve = function(change, element) {
  for (const record of change.records) {
    this._approved.add(getApprovalKey(element, record));
  }

  this.compute();
};

/**
 * Revert a change via modeling (undoable) and recompute changes.
 *
 * @param {Change} change
 * @param {Object} element
 */
DiffDemoChanges.prototype.restore = function(change, element) {
  const modeling = this._injector.get('modeling');
  const bpmnFactory = this._injector.get('bpmnFactory');
  const moddleCopy = this._injector.get('moddleCopy');

  const businessObject = getBusinessObject(element);

  for (const record of change.records) {
    if (record.type === 'added' || !isRestorable(record)) {
      continue;
    }

    // removed list item: re-insert a copy at its original position
    if (record.item) {
      const owner = resolvePath(businessObject, record.collectionPath.slice(0, -1));
      const property = record.collectionPath[ record.collectionPath.length - 1 ];

      if (!owner) {
        continue;
      }

      const copy = moddleCopy.copyElement(record.item, bpmnFactory.create(record.item.$type));
      copy.$parent = owner;

      const list = [ ...owner.get(property) ];
      list.splice(Math.min(record.index, list.length), 0, copy);

      modeling.updateModdleProperties(element, owner, { [ property ]: list });

      continue;
    }

    const parent = resolvePath(businessObject, record.parentPath);

    if (!parent) {
      continue;
    }

    if (parent === businessObject) {
      modeling.updateProperties(element, { [ record.property ]: record.oldValue });
    } else {
      modeling.updateModdleProperties(element, parent, { [ record.property ]: record.oldValue });
    }
  }

  this.compute();
};

// helpers //////////

function getApprovalKey(element, record) {
  return `${ element.id }::${ record.key }`;
}

function isRestorable(record) {
  const path = record.item ? record.collectionPath : record.parentPath;

  return !!path && !path.includes(null);
}

function resolvePath(node, path) {
  for (const segment of path) {
    if (!node) {
      return null;
    }

    node = typeof segment === 'number' ? node[ segment ] : node.get(segment);
  }

  return node;
}

function getItemKey(item) {
  const getKey = LIST_ITEM_KEYS[ item.$type ];

  return (getKey && getKey(item)) || item.$type;
}

/**
 * Prefix labels of properties within list items, e.g. `Output: customer › `.
 */
function getItemLabelPrefix(businessObject, path) {
  let node = businessObject;
  let prefix = '';

  for (const segment of path.slice(0, -1)) {
    node = node && (typeof segment === 'number' ? node[ segment ] : node.get(segment));

    if (node && ITEMS[ node.$type ]) {
      prefix += `${ ITEMS[ node.$type ].label }: ${ getItemKey(node) } › `;
    }
  }

  return prefix;
}

function getEntryGroup(entryId) {
  if (!entryId) {
    return undefined;
  }

  const match = ENTRY_GROUPS.find(([ pattern ]) => pattern.test(entryId));

  return match && match[ 1 ];
}

function humanize(property) {
  if (!property) {
    return '';
  }

  const words = property.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

  return words.charAt(0).toUpperCase() + words.slice(1);
}
