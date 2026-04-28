/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useMemo, useState } from 'react';

import { ComboBox } from '@carbon/react';

import * as css from './StickyConnectorRegion.less';

/**
 * Find the operation Dropdown property on an element template.
 *
 * Priority:
 *   1. A property whose `id` is exactly 'method' or 'operation' (the
 *      conventional ids used by all marketplace connector templates we've
 *      inspected — Slack, Salesforce, GitHub, REST, etc.).
 *   2. Fallback: the first Dropdown property with 2+ choices, for any
 *      template that uses a non-standard id.
 *
 * Templates without a matching property (e.g. single-op connectors) get
 * no Operation selector — the bpmn-io properties panel still owns the
 * canonical value, we just don't surface a fancy peer picker.
 *
 * Returns { property, choices } or null.
 */
export function findOperationProperty(template) {
  if (!template || !Array.isArray(template.properties)) return null;

  // Pass 1: well-known ids.
  for (const prop of template.properties) {
    if (!prop || prop.type !== 'Dropdown') continue;
    if (!Array.isArray(prop.choices) || prop.choices.length < 2) continue;
    const id = (prop.id || '').toLowerCase();
    if (id === 'method' || id === 'operation' || id.endsWith('operationtype')) {
      return { property: prop, choices: prop.choices };
    }
  }

  // Pass 2: first multi-choice Dropdown.
  for (const prop of template.properties) {
    if (prop && prop.type === 'Dropdown' && Array.isArray(prop.choices) && prop.choices.length >= 2) {
      return { property: prop, choices: prop.choices };
    }
  }
  return null;
}

/**
 * Searchable Operation selector. Carbon `ComboBox` for the filterable
 * picker — gives us free typeahead, keyboard navigation, and visual
 * alignment with the rest of the modeler chrome (2px radius via Carbon
 * tokens overridden in the wrapping CSS).
 *
 * NOTE — write-back to BPMN XML is intentionally deferred. This component
 * tracks the picked value in local state (so the UX feels responsive) and
 * fires `onPick` for observability. The bpmn-io Dropdown rendered below
 * remains the canonical write surface until write-back lands.
 *
 * Renders nothing when the template has no operation Dropdown property.
 *
 * @param {object} props
 * @param {object} props.template          - applied element template
 * @param {string} [props.initialValue]    - current value of the operation property (read from businessObject)
 * @param {function} [props.onPick]        - optional (propertyMeta, nextValue) callback for parent observability
 */
export default function OperationSelector({ template, initialValue, onPick }) {
  const opMeta = useMemo(() => findOperationProperty(template), [ template ]);
  const [ value, setValue ] = useState(initialValue || null);

  if (!opMeta) return null;

  const { property, choices } = opMeta;

  const items = useMemo(
    () => choices.map(c => ({ id: c.value, text: c.name })),
    [ choices ]
  );

  const selectedItem = items.find(it => it.id === value) || null;

  const handleChange = ({ selectedItem: next }) => {
    if (!next) return;
    setValue(next.id);
    if (typeof onPick === 'function') onPick(property, next.id);
  };

  return (
    <div className={ css.opSelector }>
      <ComboBox
        id={ `connectors-context-op-${property.id || 'method'}` }
        size="sm"
        titleText={ property.label || 'Method' }
        placeholder="Choose an operation"
        items={ items }
        itemToString={ it => (it ? it.text : '') }
        selectedItem={ selectedItem }
        onChange={ handleChange }
      />
    </div>
  );
}
