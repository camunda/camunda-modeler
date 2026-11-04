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

import { ArrowDown, ArrowUp, ChevronDown, ChevronRight } from '@camunda/design-system/icons';

import { GROUP_LABELS } from './changes';
import { LABELS, TYPES } from './DiffDemoMarkers';

import './DiffDemoSummary.css';

/**
 * PROTOTYPE: collapsible summary of the changes of the element shown in the
 * properties panel. Rendered on top of the properties panel.
 *
 * Clicking a change intentionally does nothing: focusing the field would
 * hide its inline diff. Up / down step through the changes and scroll them
 * into view.
 *
 * @param {Object} props
 * @param {Object} props.injector
 */
export default function DiffDemoSummary({ injector }) {
  const [ changes, setChanges ] = useState(() => injector.get('diffDemoMarkers').getElementChanges());
  const [ open, setOpen ] = useState(true);
  const [ index, setIndex ] = useState(null);

  const eventBus = injector.get('eventBus');

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
              key={ change.entry || change.ghost }
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
              <span className="diff-demo-summary-group">{ GROUP_LABELS[ change.group ] || change.group }</span>
              <span className={ `diff-demo-summary-tag diff-demo-summary-tag--${ change.type }` }>
                { LABELS[ change.type ] }
              </span>
            </li>
          )) }
        </ul>
      ) }
    </div>
  );
}
