/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * Low priority so this provider runs AFTER the default bpmn-js
 * AppendContextPadProvider. Since diagram-js's ContextPad iterates providers
 * in the order they were collected (highest-priority event handler first),
 * running LAST lets us see the `append` entry that other providers added and
 * replace it with our guided `append.guided` entry.
 */
const LOW_PRIORITY = 500;

/**
 * Context-pad provider that:
 *   - leaves every existing entry untouched (experts keep their muscle memory)
 *   - removes the default flat "append anything" (`append`) entry
 *   - adds a new primary "+" entry (`append.guided`) that opens our React wizard
 */
export default function GuidedAppendContextPadProvider(contextPad, guidedAppend, translate) {
  this._contextPad = contextPad;
  this._guidedAppend = guidedAppend;
  this._translate = translate;

  contextPad.registerProvider(LOW_PRIORITY, this);
}

GuidedAppendContextPadProvider.$inject = [
  'contextPad',
  'guidedAppend',
  'translate'
];

GuidedAppendContextPadProvider.prototype.getContextPadEntries = function(element) {
  const guidedAppend = this._guidedAppend;
  const translate = this._translate;

  // Return an updater function so we can modify the entries accumulated by
  // higher-priority providers (notably bpmn-js-create-append-anything, which
  // adds the `append` entry).
  return function(entries) {

    // Only show the guided "+" on shapes that can be appended from.
    // Sequence flows, labels, the root, etc. are skipped.
    if (!canAppend(element)) {
      return entries;
    }

    // Remove the default flat "append anything" entry — our "+" takes its place.
    delete entries['append'];

    // Drop `append.end-event` from the primitive row. End-events are terminal,
    // not "continue the flow" — grouping them alongside task / gateway /
    // intermediate-event muddles the row's semantic. Users who want an
    // end-event can reach it through the guided "+" wizard's "Intermediate
    // events" group (which includes end-event as a leaf).
    delete entries['append.end-event'];

    // Move the connect entry into the same visual group as the primitive
    // append tiles so it renders as the 4th element of that row rather than
    // floating on its own line. The entry's behaviour (drag-to-connect) is
    // unchanged — only its visual grouping moves.
    if (entries['connect']) {
      entries['connect'].group = 'model';
    }

    // Own group (not `model`) so CSS can treat it as its own layout row
    // distinct from the primitive quick-append tiles.
    entries['append.guided'] = {
      group: 'guided',
      html: '<div class="entry djs-context-pad-entry--primary" title="' +
            translate('Guided append') + '">+</div>',
      title: translate('Guided append — pick what happens next'),
      action: {
        click: function(event, element) {
          guidedAppend.open(element);
        }
      }
    };

    return entries;
  };
};

/**
 * Matches bpmn-js' own rules: append is possible from most activity-flow
 * elements but not from boundary events, gateways-as-targets, etc. For the
 * prototype we use a liberal check — anything that is a FlowNode and not an
 * EndEvent can be appended from.
 */
function canAppend(element) {
  if (!element || !element.businessObject) return false;
  if (is(element, 'bpmn:EndEvent')) return false;
  if (is(element, 'bpmn:BoundaryEvent')) return false;
  if (is(element, 'bpmn:SequenceFlow')) return false;
  if (is(element, 'bpmn:DataObjectReference')) return false;
  if (is(element, 'bpmn:DataStoreReference')) return false;
  if (is(element, 'label')) return false;
  return is(element, 'bpmn:FlowNode');
}
