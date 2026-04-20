/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { SCENARIOS } from './copilotScenarios';
import { CopilotPlayer } from './CopilotPlayer';
import CopilotActionLog from './CopilotActionLog';
import CopilotNarration from './CopilotNarration';

import * as css from './GuidedStart.less';

const PHASE_IDLE = 'idle';
const PHASE_PLAYING = 'playing';
const PHASE_READY = 'ready';

/**
 * Interactive AI Copilot pane. Replaces the previous informational stub.
 * Marionetted — no LLM calls.
 *
 * Playback is performed on the host editor's real canvas via the
 * onPlayStart / onPlayStep / onPlayReset callbacks. The panel itself
 * shows the prompt, chips, narration, action log, and accept controls.
 *
 * Props:
 *   - onClose: () => void
 *   - onAccept: (xml, log) => void    // invoked on "Use this"
 *   - onPlayStart: () => void         // invoked once before the first step
 *   - onPlayStep: (partialXml) => Promise<void>  // invoked per step
 *   - onPlayReset: () => Promise<void>|void      // clears the real canvas
 *   - canvasIsEmpty: boolean          // snapshotted on mount for lock-state
 */
export default function AiPanel({
  onClose,
  onAccept,
  onPlayStart,
  onPlayStep,
  onPlayReset,
  canvasIsEmpty
}) {

  // Snapshot on mount. Once playback begins, the real canvas will fill up
  // with elements and `canvasIsEmpty` flips to false — but we don't want the
  // panel to swap itself out for the "locked" state mid-playback.
  const [ wasEmptyOnOpen ] = useState(canvasIsEmpty);

  const [ phase, setPhase ] = useState(PHASE_IDLE);
  const [ prompt, setPrompt ] = useState('');
  const [ activeScenario, setActiveScenario ] = useState(null);
  const [ narration, setNarration ] = useState('');
  const [ log, setLog ] = useState([]);

  const playerRef = useRef(null);

  const resetState = useCallback(() => {
    if (playerRef.current) playerRef.current.stop();
    playerRef.current = null;
    setPhase(PHASE_IDLE);
    setPrompt('');
    setActiveScenario(null);
    setNarration('');
    setLog([]);
    if (onPlayReset) onPlayReset();
  }, [ onPlayReset ]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (playerRef.current) playerRef.current.stop();
  }, []);

  const handleChipClick = useCallback((scenario) => {
    setPrompt(scenario.chip.prompt);
    setActiveScenario(scenario);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!activeScenario) return;
    setLog([]);
    setNarration('');
    setPhase(PHASE_PLAYING);

    if (onPlayStart) onPlayStart();

    const player = new CopilotPlayer(activeScenario);
    playerRef.current = player;

    player.on('step', async (step) => {
      setNarration(step.narration);
      setLog(prev => [ ...prev, step ]);
      const xml = player.getPartialXml(step.index);
      if (onPlayStep) {
        try { await onPlayStep(xml); } catch (_) { /* swallow parse errors on partial XML */ }
      }
    });

    player.on('complete', () => {
      setPhase(PHASE_READY);
    });

    await player.start();
  }, [ activeScenario, onPlayStart, onPlayStep ]);

  const handleRegenerate = useCallback(() => {
    resetState();
  }, [ resetState ]);

  const handleUseThis = useCallback(() => {
    if (!activeScenario) return;
    onAccept(activeScenario.resultXml, log);
  }, [ activeScenario, log, onAccept ]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && phase === PHASE_IDLE && activeScenario) {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === 'Escape' && phase === PHASE_PLAYING) {
      handleRegenerate();
    }
  }, [ phase, activeScenario, handleGenerate, handleRegenerate ]);

  if (!wasEmptyOnOpen) {
    return (
      <div className={ css.aiSidePanel }>
        <div className={ css.aiSidePanelHeader }>
          <span className={ css.aiSidePanelTitle }>✦  AI assistance</span>
          <button className={ css.aiSidePanelClose } onClick={ onClose } aria-label="Close AI panel">✕</button>
        </div>
        <div className={ css.aiSidePanelLocked }>
          <p><strong>AI draft mode is only available on a fresh canvas.</strong></p>
          <p>Start from a new file (File → New → BPMN Diagram) to use the AI draft assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ css.aiSidePanel }>
      <div className={ css.aiSidePanelHeader }>
        <span className={ css.aiSidePanelTitle }>✦  AI assistance</span>
        <button className={ css.aiSidePanelClose } onClick={ onClose } aria-label="Close AI panel">✕</button>
      </div>

      <div className={ css.aiSidePanelBody }>
        <textarea
          className={ css.copilotPrompt }
          value={ prompt }
          placeholder="Describe the process you want to build…"
          onChange={ e => setPrompt(e.target.value) }
          onKeyDown={ handleKeyDown }
          rows={ 3 }
          disabled={ phase === PHASE_PLAYING }
        />

        { phase === PHASE_IDLE && (
          <div className={ css.copilotChips }>
            { SCENARIOS.map(s => (
              <button
                key={ s.id }
                type="button"
                className={ classNames(css.copilotChip, { [css.isActive]: activeScenario && activeScenario.id === s.id }) }
                onClick={ () => handleChipClick(s) }
              >
                { s.chip.label }
              </button>
            )) }
          </div>
        ) }

        { phase === PHASE_IDLE && (
          <button
            type="button"
            className={ css.copilotGenerate }
            onClick={ handleGenerate }
            disabled={ !activeScenario }
          >Generate</button>
        ) }

        { phase !== PHASE_IDLE && (
          <>
            <CopilotNarration text={ narration } />
            <CopilotActionLog entries={ log } interactive={ false } />
            { phase === PHASE_READY && (
              <div className={ css.copilotActions }>
                <button type="button" className={ css.copilotRegenerate } onClick={ handleRegenerate }>Regenerate</button>
                <button type="button" className={ css.copilotUseThis } onClick={ handleUseThis }>Use this</button>
              </div>
            ) }
          </>
        ) }
      </div>
    </div>
  );
}
