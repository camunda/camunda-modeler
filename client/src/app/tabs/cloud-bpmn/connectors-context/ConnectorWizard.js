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

import { findOperationProperty } from './OperationSelector';
import {
  findByApp,
  openHubCreate
} from './mockConnectionsStore';

import * as css from './ConnectorWizard.less';

/**
 * Guided two-phase wizard for connector templates. Walks the user from
 * "I picked Slack" through "what operation?" → "what connection?" → done.
 *
 * Triggered when the user clicks Configure on a connector-template result
 * in the AppendWizard search list. Single-op templates (e.g. some legacy
 * connectors with no method choice) skip straight to the connection phase.
 *
 * Phases:
 *   1. operation  — list the template's operation Dropdown choices; user
 *                   picks one. Skipped when findOperationProperty is null.
 *   2. connection — list connections fuzzy-filtered to the template's app;
 *                   user picks an existing one or hands off to Hub via
 *                   `openHubCreate(app)`. Can be skipped (placeholder
 *                   "Skip for now").
 *
 * On confirm, calls `onConfirm({ template, opHint, connectionId })`. The
 * caller (AppendWizard / BpmnEditor) is responsible for applying the
 * template, persisting the operation pick, and binding the connection.
 *
 * @param {object} props
 * @param {object} props.template     - element template selected in the search
 * @param {string} [props.app]        - human-readable app name for picker filtering
 * @param {function} props.onConfirm  - ({ template, opHint, connectionId }) => void
 * @param {function} props.onCancel   - close the wizard without applying
 */
export default function ConnectorWizard({ template, app, onConfirm, onCancel }) {
  const opMeta = useMemo(() => findOperationProperty(template), [ template ]);
  const hasOperations = !!opMeta;

  const initialPhase = hasOperations ? 'operation' : 'connection';
  const [ phase, setPhase ] = useState(initialPhase);
  const [ opHint, setOpHint ] = useState(null);

  const handleOperationPicked = (value) => {
    setOpHint(value);
    setPhase('connection');
  };

  const handleConnectionPicked = (connection) => {
    onConfirm({ template, opHint, connectionId: connection ? connection.id : null });
  };

  const handleSkipConnection = () => {
    onConfirm({ template, opHint, connectionId: null });
  };

  const handleBack = () => {
    if (phase === 'connection' && hasOperations) {
      setPhase('operation');
      setOpHint(null);
    } else {
      onCancel();
    }
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ onCancel ]);

  return (
    <>
      <div className={ css.backdrop } onClick={ onCancel } />
      <div className={ css.dialog } role="dialog" aria-modal="true">
        <div className={ css.header }>
          <button
            type="button"
            className={ css.backBtn }
            onClick={ handleBack }
          >← Back</button>
          <div className={ css.titleRow }>
            { template.icon && template.icon.contents && (
              <img className={ css.titleIcon } src={ template.icon.contents } alt="" aria-hidden="true" />
            ) }
            <span className={ css.titleText }>{ template.name || 'Connector' }</span>
          </div>
        </div>

        { phase === 'operation' && (
          <OperationPhase
            choices={ opMeta.choices }
            onPick={ handleOperationPicked }
          />
        ) }

        { phase === 'connection' && (
          <ConnectionPhase
            app={ app }
            opHint={ opHint }
            onPick={ handleConnectionPicked }
            onSkip={ handleSkipConnection }
          />
        ) }
      </div>
    </>
  );
}

// ─── Operation phase ──────────────────────────────────────────────────────

function OperationPhase({ choices, onPick }) {
  const [ query, setQuery ] = useState('');
  const [ activeIdx, setActiveIdx ] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const matches = useMemo(() => {
    if (!query) return choices;
    const q = query.toLowerCase();
    return choices.filter(c =>
      (c.name || '').toLowerCase().indexOf(q) !== -1
      || (c.value || '').toLowerCase().indexOf(q) !== -1
    );
  }, [ choices, query ]);

  useEffect(() => { setActiveIdx(0); }, [ query ]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const choice = matches[activeIdx];
      if (choice) onPick(choice.value);
    }
  };

  return (
    <>
      <p className={ css.phaseTitle }>What operation should run?</p>
      <input
        ref={ inputRef }
        className={ css.search }
        placeholder="Filter operations"
        value={ query }
        onChange={ e => setQuery(e.target.value) }
        onKeyDown={ onKeyDown }
      />
      <div className={ css.list }>
        { matches.length === 0 && <div className={ css.empty }>No matches.</div> }
        { matches.map((choice, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              type="button"
              key={ choice.value }
              className={ `${css.row} ${isActive ? css.rowActive : ''}` }
              onMouseEnter={ () => setActiveIdx(idx) }
              onClick={ () => onPick(choice.value) }
            >
              <span className={ css.rowLabel }>{ choice.name }</span>
              <span className={ css.rowMeta }>{ choice.value }</span>
            </button>
          );
        }) }
      </div>
      <div className={ css.footer }>
        <span>↑↓ navigate</span>
        <span>↵ continue</span>
        <span>esc cancel</span>
      </div>
    </>
  );
}

// ─── Connection phase ─────────────────────────────────────────────────────

function ConnectionPhase({ app, opHint, onPick, onSkip }) {
  const [ query, setQuery ] = useState('');
  const [ activeIdx, setActiveIdx ] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const matches = useMemo(() => {
    const filteredByApp = findByApp(app);
    if (!query) return filteredByApp;
    const q = query.toLowerCase();
    return filteredByApp.filter(c =>
      c.name.toLowerCase().indexOf(q) !== -1
      || c.owner.toLowerCase().indexOf(q) !== -1
    );
  }, [ app, query ]);

  useEffect(() => { setActiveIdx(0); }, [ query ]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = matches[activeIdx];
      if (c) onPick(c);
    }
  };

  const handleCreate = () => {
    openHubCreate(app);
    // We don't auto-confirm — the user comes back to the modeler manually
    // and picks the new connection from the refreshed list. Leave the
    // wizard open on the connection phase.
  };

  return (
    <>
      <p className={ css.phaseTitle }>
        Pick a connection
        { opHint && (
          <span className={ css.phaseSub }> · operation { opHint }</span>
        ) }
      </p>
      <input
        ref={ inputRef }
        className={ css.search }
        placeholder="Filter connections"
        value={ query }
        onChange={ e => setQuery(e.target.value) }
        onKeyDown={ onKeyDown }
      />
      <div className={ css.list }>
        { matches.length === 0 && (
          <div className={ css.empty }>
            No connections{ app ? ` for ${app}` : '' }.
          </div>
        ) }
        { matches.map((c, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              type="button"
              key={ c.id }
              className={ `${css.row} ${isActive ? css.rowActive : ''}` }
              onMouseEnter={ () => setActiveIdx(idx) }
              onClick={ () => onPick(c) }
            >
              <span className={ `${css.statusDot} ${css[`status--${c.status}`]}` } aria-hidden="true" />
              <span className={ css.rowBody }>
                <span className={ css.rowLabel }>{ c.name }</span>
                <span className={ css.rowMeta }>
                  { c.scope === 'organization' ? 'Org' : 'Workspace' } · { c.authMethod } · used by { c.usedBy }
                </span>
              </span>
            </button>
          );
        }) }
      </div>
      <div className={ css.footerSplit }>
        <button type="button" className={ css.linkBtn } onClick={ onSkip }>
          Skip — connect later
        </button>
        <button type="button" className={ css.ghostBtn } onClick={ handleCreate }>
          + Create new connection ↗
        </button>
      </div>
    </>
  );
}
