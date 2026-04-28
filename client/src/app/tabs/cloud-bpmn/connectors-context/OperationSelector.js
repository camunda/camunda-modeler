/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

import * as css from './StickyConnectorRegion.less';

/**
 * Find the "operation property" on an element template — the Dropdown
 * whose choices represent the connector's operations (e.g. Salesforce's
 * `salesforceOperationType`, GitHub's method picker).
 *
 * Heuristic for the prototype: the first Dropdown property with 2+ choices.
 * Templates without such a property (e.g. single-op Slack outbound) get no
 * Operation selector — the bpmn-io properties panel still owns the canonical
 * value, we just don't surface a fancy peer picker.
 *
 * Returns { property, choices } or null.
 */
export function findOperationProperty(template) {
  if (!template || !Array.isArray(template.properties)) return null;
  for (const prop of template.properties) {
    if (prop && prop.type === 'Dropdown' && Array.isArray(prop.choices) && prop.choices.length >= 2) {
      return { property: prop, choices: prop.choices };
    }
  }
  return null;
}

/**
 * Searchable Operation selector. Evergreen `SelectMenu` shape — filter input
 * at the top, scrollable choice list below, click-to-pick, click-outside or
 * Esc to close.
 *
 * Mirror approach (per locked design Q2): the bpmn-io Dropdown for this same
 * property still exists in the panel below; this selector reflects the
 * current value and writes back via the `onPick` callback so the parent can
 * call `modeling.updateProperties` and keep BPMN XML in sync.
 *
 * Renders nothing when the template has no multi-choice Dropdown property
 * (single-op connectors like Slack outbound).
 *
 * NOTE — write-back to BPMN XML is intentionally deferred. The first cut
 * tracks the picked value in local state (so the UX feels responsive) and
 * fires `onPick` for observability. Persisting picks via bpmn-js
 * `modeling.updateProperties` (or the bpmn-io Dropdown DOM mirror) is the
 * follow-up. Until then, the canonical value still lives in the bpmn-io
 * Dropdown below — pick there to actually persist.
 *
 * @param {object} props
 * @param {object} props.template          - applied element template
 * @param {string} [props.initialValue]    - current value of the operation property (from businessObject)
 * @param {function} [props.onPick]        - optional callback (propertyMeta, nextValue) for parent observability
 */
export default function OperationSelector({ template, initialValue, onPick }) {
  const [ open, setOpen ] = useState(false);
  const [ query, setQuery ] = useState('');
  const [ value, setValue ] = useState(initialValue || null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const opMeta = useMemo(() => findOperationProperty(template), [ template ]);

  // Auto-focus the filter input when the dropdown opens.
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [ open ]);

  // Click-outside closes; Esc closes.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = e => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [ open ]);

  if (!opMeta) return null;

  const { property, choices } = opMeta;

  const matches = useMemo(() => {
    if (!query) return choices;
    const q = query.toLowerCase();
    return choices.filter(c => (c.name || '').toLowerCase().indexOf(q) !== -1);
  }, [ choices, query ]);

  const currentLabel = (() => {
    if (!value) return null;
    const hit = choices.find(c => c.value === value);
    return hit ? hit.name : value;
  })();

  const handlePick = choice => {
    setValue(choice.value);
    if (typeof onPick === 'function') onPick(property, choice.value);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={ css.opSelector } ref={ containerRef }>
      <label className={ css.opSelectorLabel }>{ property.label || 'Operation' }</label>
      <button
        type="button"
        className={ css.opSelectorTrigger }
        onClick={ () => setOpen(o => !o) }
        aria-haspopup="listbox"
        aria-expanded={ open }
      >
        <span>{ currentLabel || 'Choose an operation' }</span>
        <span className={ css.opSelectorChevron } aria-hidden="true">▾</span>
      </button>
      { open && (
        <div className={ css.opSelectorMenu } role="listbox">
          <input
            ref={ inputRef }
            className={ css.opSelectorFilter }
            placeholder="Filter operations"
            value={ query }
            onChange={ e => setQuery(e.target.value) }
          />
          <div className={ css.opSelectorList }>
            { matches.length === 0 && (
              <div className={ css.pickerEmpty }>No matches</div>
            ) }
            { matches.map(c => {
              const isCurrent = c.value === value;
              return (
                <button
                  type="button"
                  key={ c.value }
                  role="option"
                  aria-selected={ isCurrent }
                  className={ `${css.opSelectorItem} ${isCurrent ? css.opSelectorItemActive : ''}` }
                  onClick={ () => handlePick(c) }
                >
                  <span>{ c.name }</span>
                  { isCurrent && <span className={ css.opSelectorCheck } aria-hidden="true">✓</span> }
                </button>
              );
            }) }
          </div>
        </div>
      ) }
    </div>
  );
}
