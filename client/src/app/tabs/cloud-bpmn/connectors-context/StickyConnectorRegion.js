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
 * Sticky region above the bpmn-io properties body. Surfaces two
 * connector-only concerns the prototype elevates from per-property panel
 * fields to top-of-panel peers:
 *
 *   - Connection card (clickable; opens picker; bound or empty state)
 *   - Operation selector (Carbon ComboBox; mirrors the template's `method`
 *     Dropdown property; multi-op only)
 *
 * Renders nothing when the selected element doesn't have a connector
 * template applied — keeps the Properties tab clean for plain BPMN
 * elements.
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

  // Refresh the connection list when the window regains focus — the user
  // may have just come back from creating a connection in the Hub tab.
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // Re-render on store changes (binding, refresh, etc.).
  useEffect(() => {
    return subscribe(() => forceUpdate(n => n + 1));
  }, []);

  if (!element || !appliedTemplate) return null;
  const id = (appliedTemplate.id || '').toLowerCase();
  const isConnectorTemplate = id.indexOf('io.camunda.connectors.') === 0
    || id.indexOf('io.camunda.hub.connectors.') === 0
    || id.indexOf('io.camunda.agenticai.') === 0;
  if (!isConnectorTemplate) return null;

  const bound = getBoundConnection(element.id);
  const app = guessAppFromTemplate(appliedTemplate);
  const hasOperations = !!findOperationProperty(appliedTemplate);

  const handlePick = connection => bind(element.id, connection.id);

  return (
    <div className={ css.stickyRegion }>

      <button
        type="button"
        className={ `${css.connCard} ${bound ? '' : css.connCardEmpty}` }
        onClick={ () => setPickerOpen(true) }
        title={ bound ? 'Change connection' : 'Choose a connection' }
      >
        { bound && (
          <span className={ `${css.statusDot} ${css[`status--${bound.status}`]}` } aria-hidden="true" />
        ) }
        <span className={ css.connCardBody }>
          <span className={ css.connCardLabel }>Connection</span>
          { bound ? (
            <>
              <span className={ css.connCardName }>{ bound.name }</span>
              <span className={ css.connCardMeta }>
                { bound.scope === 'organization' ? 'Org' : 'Workspace' }
                { ' · ' }
                { bound.authMethod }
                { ' · ' }
                used by { bound.usedBy }
              </span>
            </>
          ) : (
            <>
              <span className={ css.connCardName }>Choose a connection</span>
              <span className={ css.connCardMeta }>Pick an existing one or create one in Hub</span>
            </>
          ) }
        </span>
        <span className={ css.connCardChange }>{ bound ? 'Change' : 'Choose' }</span>
      </button>

      { hasOperations && (
        <OperationSelector
          template={ appliedTemplate }
          initialValue={ initialOperation }
          onPick={ onPickOperation }
        />
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
 * Best-effort app name for picker filtering + Hub deep-linking. Marketplace
 * templates encode the app inside the id ("io.camunda.connectors.Slack.v1"
 * → "Slack"). Fall back to the friendly name when the id doesn't follow
 * that convention.
 */
function guessAppFromTemplate(template) {
  const id = template.id || '';
  const m = id.match(/^io\.camunda\.(?:hub\.)?connectors\.([^.]+)/i);
  if (m) return m[1];
  return template.name || '';
}
