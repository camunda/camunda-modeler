/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useState } from 'react';

import ConnectionPicker from './ConnectionPicker';
import OperationSelector, { findOperationProperty } from './OperationSelector';

import {
  bind,
  getBoundConnection,
  refresh,
  subscribe
} from './mockConnectionsStore';

import * as css from './StickyConnectorRegion.less';

/**
 * Sticky region above the bpmn-io properties body, surfacing the two
 * connector-only concerns the prototype elevates from per-property panel
 * fields to top-of-panel peers:
 *
 *   - Connection card (bound state, or "Select connection" CTA)
 *   - Operation selector (Evergreen SelectMenu pattern; multi-op only)
 *
 * Renders nothing when the selected element doesn't have a connector
 * template applied — keeps the Properties tab clean for plain BPMN
 * elements.
 *
 * The `onPickOperation` callback receives (property, nextValue) so the
 * parent can write back via bpmn-js `modeling.updateProperties` and keep
 * the underlying BPMN XML in sync with the bpmn-io Dropdown (mirror).
 *
 * @param {object} props
 * @param {object} [props.element]            - the currently selected bpmn-js element (with .id, .businessObject)
 * @param {object} [props.appliedTemplate]    - element template currently applied to that element, or null
 * @param {string} [props.initialOperation]   - current value of the Operation Dropdown property (read from businessObject)
 * @param {function} [props.onPickOperation]  - optional (property, nextValue) callback for parent observability
 */
export default function StickyConnectorRegion({
  element,
  appliedTemplate,
  initialOperation,
  onPickOperation
}) {
  const [ pickerOpen, setPickerOpen ] = useState(false);
  const [ , forceUpdate ] = useState(0);

  // Refresh the connection list when window regains focus — the user may
  // have just come back from creating a connection in the Hub tab.
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Re-render on store changes (binding, refresh, etc.) so the card reflects
  // the latest binding state without prop drilling from BpmnEditor.
  useEffect(() => {
    return subscribe(() => forceUpdate(n => n + 1));
  }, []);

  // Hide the region entirely when no connector template is in play.
  if (!element || !appliedTemplate) return null;
  const id = (appliedTemplate.id || '').toLowerCase();
  const isConnectorTemplate = id.indexOf('io.camunda.connectors.') === 0
    || id.indexOf('io.camunda.hub.connectors.') === 0
    || id.indexOf('io.camunda.agenticai.') === 0;
  if (!isConnectorTemplate) return null;

  const bound = getBoundConnection(element.id);
  const app = appliedTemplate.name || guessAppFromTemplateId(appliedTemplate.id);
  const hasOperations = !!findOperationProperty(appliedTemplate);

  const handlePick = connection => {
    bind(element.id, connection.id);
  };

  return (
    <div className={ css.stickyRegion }>
      <div className={ css.fieldGroup }>
        <label className={ css.fieldLabel }>Connection</label>
        { bound ? (
          <button
            type="button"
            className={ css.connCard }
            onClick={ () => setPickerOpen(true) }
            title="Change connection"
          >
            <span className={ `${css.statusDot} ${css[`status--${bound.status}`]}` } aria-hidden="true" />
            <span className={ css.connCardBody }>
              <span className={ css.connCardName }>{ bound.name }</span>
              <span className={ css.connCardMeta }>
                { bound.scope === 'organization' ? 'Org' : 'Workspace' } · { bound.authMethod } · used by { bound.usedBy }
              </span>
            </span>
            <span className={ css.connCardChange }>Change</span>
          </button>
        ) : (
          <button
            type="button"
            className={ `${css.connCard} ${css.connCardEmpty}` }
            onClick={ () => setPickerOpen(true) }
          >
            <span className={ css.connCardBody }>
              <span className={ css.connCardName }>Select a connection</span>
              <span className={ css.connCardMeta }>
                Pick an existing one or create one in Hub
              </span>
            </span>
            <span className={ css.connCardChange }>Choose</span>
          </button>
        ) }
      </div>

      { hasOperations && (
        <div className={ css.fieldGroup }>
          <OperationSelector
            template={ appliedTemplate }
            initialValue={ initialOperation }
            onPick={ onPickOperation }
          />
        </div>
      ) }

      { pickerOpen && (
        <ConnectionPicker
          app={ app }
          onPick={ handlePick }
          onClose={ () => setPickerOpen(false) }
        />
      ) }
    </div>
  );
}

/**
 * Fallback app derivation when the template lacks a friendly name. Pulls
 * the second-to-last namespace segment (`io.camunda.connectors.Slack.v1`
 * → `Slack`) — used only for Hub-create deep-linking when name is missing.
 */
function guessAppFromTemplateId(id) {
  if (!id) return '';
  const parts = id.split('.');
  if (parts.length < 2) return id;
  const tail = parts[parts.length - 1];
  return /^v\d+$/i.test(tail) ? parts[parts.length - 2] : tail;
}
