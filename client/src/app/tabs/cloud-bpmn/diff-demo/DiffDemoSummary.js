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

import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Undo2 } from '@camunda/design-system/icons';

import { GROUP_LABELS } from './DiffDemoChanges';
import { LABELS, TYPES } from './DiffDemoMarkers';

import './DiffDemoSummary.css';

/**
 * PROTOTYPE: collapsible summary of the changes of the element shown in the
 * properties panel. Rendered on top of the properties panel.
 *
 * Clicking a change (or up / down) scrolls it into view without focusing
 * the field, which would hide its inline diff. Changes can be approved or
 * reverted from the list, too.
 *
 * @param {Object} props
 * @param {Object} props.injector
 */
export default function DiffDemoSummary({ injector }) {
  const [ changes, setChanges ] = useState(() => injector.get('diffDemoMarkers').getElementChanges());
  const [ open, setOpen ] = useState(true);
  const [ index, setIndex ] = useState(null);

  const eventBus = injector.get('eventBus');
  const diffDemoChanges = injector.get('diffDemoChanges');
  const diffDemoMarkers = injector.get('diffDemoMarkers');

  useEffect(() => {
    const onElementChanges = ({ changes }) => {
      setChanges(changes);
      setIndex(null);
    };

    eventBus.on('diffDemo.elementChanges', onElementChanges);

    return () => eventBus.off('diffDemo.elementChanges', onElementChanges);
  }, [ eventBus ]);

  if (!changes.length) {
    return null;
  }

  const sorted = TYPES.flatMap(type => changes.filter(change => change.type === type));

  const select = (newIndex) => {
    setIndex(newIndex);

    eventBus.fire('diffDemo.reveal', { change: sorted[ newIndex ] });
  };

  // recomputes changes, updating the list and all markers
  const approve = (change) => diffDemoChanges.approve(change, diffDemoMarkers.getElement());
  const revert = (change) => diffDemoChanges.restore(change, diffDemoMarkers.getElement());

  const step = (delta) => {
    const length = sorted.length;

    select(index === null
      ? (delta > 0 ? 0 : length - 1)
      : (index + delta + length) % length);
  };

  return (
    <div className="diff-demo-summary">
      <div className="diff-demo-summary-header">
        <button
          type="button"
          className="diff-demo-summary-button"
          title={ open ? 'Hide changes' : 'Show changes' }
          aria-expanded={ open }
          onClick={ () => setOpen(!open) }
        >
          { open ? <ChevronDown size={ 16 } /> : <ChevronRight size={ 16 } /> }
        </button>

        <span className="diff-demo-summary-title">
          { sorted.length } { sorted.length === 1 ? 'change' : 'changes' }
        </span>

        <span className="diff-demo-summary-chips">
          { TYPES.map(type => {
            const count = changes.filter(change => change.type === type).length;

            return count ? (
              <span key={ type } className={ `diff-demo-summary-chip diff-demo-summary-chip--${ type }` }>
                { count } { LABELS[ type ].toLowerCase() }
              </span>
            ) : null;
          }) }
        </span>

        <span className="diff-demo-summary-position">
          { index === null ? '–' : index + 1 }/{ sorted.length }
        </span>

        <button type="button" className="diff-demo-summary-button" title="Previous change" onClick={ () => step(-1) }>
          <ArrowUp size={ 16 } />
        </button>
        <button type="button" className="diff-demo-summary-button" title="Next change" onClick={ () => step(1) }>
          <ArrowDown size={ 16 } />
        </button>
      </div>

      { open && (
        <ul className="diff-demo-summary-list">
          { sorted.map((change, changeIndex) => (
            <li
              key={ change.id }
              className={ `diff-demo-summary-item diff-demo-summary-item--${ change.type } ${ changeIndex === index ? 'is-current' : '' }` }
              role="button"
              tabIndex={ 0 }
              onClick={ () => select(changeIndex) }
              onKeyDown={ event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  select(changeIndex);
                }
              } }
            >
              <span className="diff-demo-summary-label">{ change.label }</span>
              <span className="diff-demo-summary-group">{ change.groupLabel || GROUP_LABELS[ change.group ] || change.group || 'Not in panel' }</span>
              <span className={ `diff-demo-summary-tag diff-demo-summary-tag--${ change.type }` }>
                { LABELS[ change.type ] }
              </span>
              <span className="diff-demo-actions diff-demo-summary-actions">
                <SummaryAction title="Approve change" onClick={ () => approve(change) }>
                  <Check size={ 16 } />
                </SummaryAction>
                { change.restorable && (
                  <SummaryAction title="Revert change" onClick={ () => revert(change) }>
                    <Undo2 size={ 16 } />
                  </SummaryAction>
                ) }
              </span>
            </li>
          )) }
        </ul>
      ) }
    </div>
  );
}

function SummaryAction({ title, onClick, children }) {
  return (
    <button
      type="button"
      className={ `diff-demo-action diff-demo-action--${ title.startsWith('Approve') ? 'approve' : 'revert' }` }
      title={ title }
      aria-label={ title }
      onClick={ event => {

        // do not select the row
        event.stopPropagation();
        onClick();
      } }
      onKeyDown={ event => event.stopPropagation() }
    >
      { children }
    </button>
  );
}
