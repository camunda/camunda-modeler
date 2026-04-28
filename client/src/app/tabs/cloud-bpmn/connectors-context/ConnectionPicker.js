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

import {
  findByApp,
  openHubCreate
} from './mockConnectionsStore';

import * as css from './StickyConnectorRegion.less';

/**
 * Connection picker overlay.
 *
 * Pre-filters the seeded connection list to the active template's app via
 * a loose name match (e.g. "Slack Connector" → connections with app "Slack").
 * Footer carries a small ghost button that hands the user off to Hub for
 * connection creation — there is no in-modeler create flow in this prototype.
 *
 * @param {object} props
 * @param {string} props.app           - app name from the active template (used to fuzzy-filter)
 * @param {function} props.onPick      - called with a connection object on selection
 * @param {function} props.onClose     - called when the picker should close (Esc, backdrop click, after pick)
 */
export default function ConnectionPicker({ app, onPick, onClose }) {
  const [ query, setQuery ] = useState('');
  const inputRef = useRef(null);

  // Auto-focus the search field for keyboard-first flow.
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  // Esc closes the picker; same affordance the append wizard already uses.
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ onClose ]);

  const matches = useMemo(() => {
    const filteredByApp = findByApp(app);
    if (!query) return filteredByApp;
    const q = query.toLowerCase();
    return filteredByApp.filter(c =>
      c.name.toLowerCase().indexOf(q) !== -1
      || c.owner.toLowerCase().indexOf(q) !== -1
    );
  }, [ app, query ]);

  const handleCreate = () => {
    openHubCreate(app);
    onClose();
  };

  return (
    <div className={ css.pickerBackdrop } onClick={ onClose }>
      <div className={ css.picker } onClick={ e => e.stopPropagation() } role="dialog" aria-label="Choose connection">
        <input
          ref={ inputRef }
          className={ css.pickerSearch }
          placeholder="Search connections"
          value={ query }
          onChange={ e => setQuery(e.target.value) }
        />
        <div className={ css.pickerList }>
          { matches.length === 0 && (
            <div className={ css.pickerEmpty }>
              No connections{ app ? ` for ${app}` : '' }.
            </div>
          ) }
          { matches.map(c => (
            <button
              type="button"
              key={ c.id }
              className={ css.pickerItem }
              onClick={ () => { onPick(c); onClose(); } }
            >
              <span className={ `${css.statusDot} ${css[`status--${c.status}`]}` } aria-hidden="true" />
              <span className={ css.pickerItemBody }>
                <span className={ css.pickerItemName }>{ c.name }</span>
                <span className={ css.pickerItemMeta }>
                  { c.scope === 'organization' ? 'Org' : 'Workspace' }
                  { ' · ' }
                  { c.authMethod }
                  { ' · ' }
                  used by { c.usedBy }
                </span>
              </span>
            </button>
          )) }
        </div>
        <div className={ css.pickerFooter }>
          <button
            type="button"
            className={ css.ghostBtn }
            onClick={ handleCreate }
            title="Opens the Camunda Hub create-connection page in your browser"
          >
            + Create new connection ↗
          </button>
        </div>
      </div>
    </div>
  );
}
