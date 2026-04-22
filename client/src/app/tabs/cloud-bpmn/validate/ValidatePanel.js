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

import useCurrentSelection from './useCurrentSelection';
import RequiredInputsCard from './RequiredInputsCard';
import { isRunnable } from './runnability';

import * as css from './ValidatePanel.less';

/**
 * ValidatePanel — Validate-mode chrome rendered above the @camunda/task-testing
 * component. Owns:
 *   - the required-inputs card (variable-resolver → one row per read var)
 *   - the suggested-inputs section (prior run outputs → one-click pre-fill)
 *   - the runnability banner (advisory when caveated, disabled-reason when
 *     the element can't be run at all)
 *
 * Element selection is read from bpmn-js directly via useCurrentSelection —
 * the library also listens to selection.changed internally, so our panel
 * and the library stay in sync without explicit handshake.
 */
export default function ValidatePanel({ injector, validateSession, onUseInputs }) {
  const element = useCurrentSelection(injector);

  if (!element) {
    return (
      <div className={ css.panel }>
        <div className={ css.emptyState }>
          Select an element on the canvas to validate it.
        </div>
      </div>
    );
  }

  const { enabled, advisory, explanation } = isRunnable(element);

  return (
    <div className={ css.panel }>
      <RequiredInputsCard element={ element } injector={ injector } />
      <SuggestedInputsSection
        validateSession={ validateSession }
        onUseInputs={ onUseInputs }
      />
      { !enabled && explanation ? (
        <div className={ `${css.banner} ${css['banner--disabled']}` }>
          <span className={ css.bannerIcon }>—</span>
          <span>{ explanation }</span>
        </div>
      ) : null }
      { enabled && advisory ? (
        <div className={ `${css.banner} ${css['banner--advisory']}` }>
          <span className={ css.bannerIcon }>⚠</span>
          <span>{ advisory }</span>
        </div>
      ) : null }
    </div>
  );
}

/**
 * SuggestedInputsSection — shows accumulated variables from prior successful
 * runs and offers a one-click "Use as inputs" button that pre-fills the
 * task-testing input config via the onUseInputs callback.
 *
 * Hidden when:
 *   - validateSession is null/undefined (not wired up yet)
 *   - the session is empty (no successful runs yet)
 */
function SuggestedInputsSection({ validateSession, onUseInputs }) {
  const [ vars, setVars ] = useState({});

  useEffect(() => {
    if (!validateSession) return undefined;

    const sync = () => setVars(validateSession.getAccumulatedVariables());
    sync(); // prime on mount
    return validateSession.listen(sync);
  }, [ validateSession ]);

  const keys = Object.keys(vars);
  if (!validateSession || keys.length === 0) return null;

  const sources = validateSession.getSources();
  const sourceLabel = sources.map(s => s.label).join(', ');

  return (
    <div className={ css.suggestedInputs }>
      <div className={ css.suggestedHeader }>
        <span className={ css.suggestedTitle }>Available from prior runs</span>
        <span className={ css.suggestedSource }>{ sourceLabel }</span>
      </div>
      <div className={ css.suggestedKeys }>
        { keys.map(k => (
          <span key={ k } className={ css.suggestedKey }>{ k }</span>
        )) }
      </div>
      <button
        type="button"
        className={ css.suggestedUseButton }
        onClick={ () => onUseInputs && onUseInputs(vars) }
      >
        Use as inputs
      </button>
    </div>
  );
}

/**
 * Composes a runnability-aware `onTestTask` guard on top of the tab's
 * existing connection check. Returns `false` (abort) when the selected
 * element is non-runnable.
 *
 *   const onTestTask = composeOnTestTask({
 *     injector,
 *     connectionGuard: handleTestTask
 *   });
 */
export function composeOnTestTask({ injector, connectionGuard }) {
  return async () => {

    // Connection gate first — mirrors existing behavior (pops the connection
    // selector if not configured).
    const canConnect = await connectionGuard();
    if (!canConnect) return false;

    // Runnability gate — reads the current selection at call time so we
    // don't hold a stale reference.
    let element = null;
    try {
      const selection = injector.get('selection');
      const selected = selection.get();
      element = selected && selected.length > 0 ? selected[0] : null;
    } catch (e) { /* no selection service — allow run */ }

    if (!element) return true; // nothing selected → defer to library
    const { enabled } = isRunnable(element);
    return enabled;
  };
}
