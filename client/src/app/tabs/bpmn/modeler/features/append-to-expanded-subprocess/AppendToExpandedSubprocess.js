/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

import {
  is
} from 'bpmn-js/lib/util/ModelUtil';

import {
  isExpanded
} from 'bpmn-js/lib/util/DiUtil';

const HIGH_PRIORITY = 2000;


/**
 * Allows dropping elements into an expanded sub-process when the sub-process
 * is the context pad source (i.e. the user drags from its context pad and drops
 * inside). No sequence-flow connection is created because the new element ends
 * up in a different scope (inside the sub-process) from the source.
 *
 * Implements bpmn-io/bpmn-js#2391.
 */
export default class AppendToExpandedSubprocess extends RuleProvider {
  constructor(eventBus) {
    super(eventBus);
  }

  init() {
    this.addRule('shape.create', HIGH_PRIORITY, shapeCreateRule);
  }
}

AppendToExpandedSubprocess.$inject = [ 'eventBus' ];


// helpers //////////

/**
 * Allow dropping flow elements into an expanded sub-process
 * when the sub-process itself is the context pad source.
 *
 * @param {Object} context
 * @return {boolean|undefined}
 */
export function shapeCreateRule(context) {
  const { shape, source, target } = context;

  // Only handle the specific case where:
  //   • source and target are the same element
  //   • that element is an expanded sub-process
  if (!source || !target || source !== target) {
    return;
  }

  if (!is(target, 'bpmn:SubProcess') || !isExpanded(target)) {
    return;
  }

  // Allow flow elements to be dropped into the expanded sub-process.
  // Data store references live at process/collaboration level and are excluded.
  if (is(shape, 'bpmn:FlowElement') && !is(shape, 'bpmn:DataStoreReference')) {
    return true;
  }
}
