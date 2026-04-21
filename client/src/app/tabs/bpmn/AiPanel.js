/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'classnames';

import { SCENARIOS } from './copilotScenarios';
import { CopilotPlayer } from './CopilotPlayer';
import CopilotActionLog from './CopilotActionLog';

import * as css from './GuidedStart.less';

const PHASE_IDLE = 'idle';
const PHASE_PLAYING = 'playing';
const PHASE_READY = 'ready';

function formatTimestamp(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Interactive AI Copilot pane wrapped in a chat-window shell.
 *
 * The underlying marionette interaction (scenario chips → narration →
 * action log → clickable rows that drive the floating stepper) is
 * unchanged. This shell presents it as a chat conversation with the
 * "Camunda Copilot" assistant.
 *
 * Props:
 *   - onClose: () => void
 *   - onAccept: (xml, log) => void    // invoked on "Accept edit"
 *   - onPlayStart: () => void         // invoked once before the first step
 *   - onPlayStep: (partialXml) => Promise<void>  // invoked per step
 *   - onPlayReset: () => Promise<void>|void      // clears the real canvas
 *   - onLogChange: (log) => void      // continuously syncs log upward
 *   - onActivateEntry: (index) => void // log row click → open stepper
 *   - activeEntryIndex: number|null    // currently-scoped stepper entry
 *   - canvasIsEmpty: boolean           // snapshotted on mount for lock-state
 *   - processName: string              // shown as chat subtitle
 *   - selectedElementId: string|null   // shown in the composer context chip
 */
export default function AiPanel({
  onClose,
  onAccept,
  onPlayStart,
  onPlayStep,
  onPlayReset,
  onLogChange,
  onActivateEntry,
  activeEntryIndex,
  canvasIsEmpty,
  processName,
  selectedElementId
}) {

  // Snapshot on mount. Once playback begins, the real canvas will fill up
  // with elements and `canvasIsEmpty` flips to false — but we don't want
  // the panel to swap itself out for the "locked" state mid-playback.
  const [ wasEmptyOnOpen ] = useState(canvasIsEmpty);

  const [ phase, setPhase ] = useState(PHASE_IDLE);
  const [ prompt, setPrompt ] = useState('');
  const [ activeScenario, setActiveScenario ] = useState(null);
  const [ narration, setNarration ] = useState('');
  const [ log, setLog ] = useState([]);

  // The submitted prompt is remembered separately from the live input so
  // the chat transcript keeps showing what the user sent even after the
  // composer is cleared / repopulated during Regenerate.
  const [ submittedPrompt, setSubmittedPrompt ] = useState('');
  const [ submittedAt, setSubmittedAt ] = useState(null);

  const playerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const resetState = useCallback(() => {
    if (playerRef.current) playerRef.current.stop();
    playerRef.current = null;
    setPhase(PHASE_IDLE);
    setPrompt('');
    setActiveScenario(null);
    setNarration('');
    setLog([]);
    setSubmittedPrompt('');
    setSubmittedAt(null);
    if (onPlayReset) onPlayReset();
  }, [ onPlayReset ]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (playerRef.current) playerRef.current.stop();
  }, []);

  // Sync the accumulated log upward so BpmnEditor can render the stepper
  // as soon as the user clicks a log row — no need to wait for Accept.
  useEffect(() => {
    if (onLogChange) onLogChange(log);
  }, [ log, onLogChange ]);

  // Auto-scroll the transcript as new content arrives.
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [ phase, log.length, narration ]);

  const handleSuggestionClick = useCallback((scenario) => {
    setPrompt(scenario.chip.prompt);
    setActiveScenario(scenario);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!activeScenario) return;
    setLog([]);
    setNarration('');
    setSubmittedPrompt(prompt || activeScenario.chip.prompt);
    setSubmittedAt(new Date());
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
  }, [ activeScenario, prompt, onPlayStart, onPlayStep ]);

  const handleChange = useCallback(() => {
    resetState();
  }, [ resetState ]);

  const handleAcceptEdit = useCallback(() => {
    if (!activeScenario) return;
    onAccept(activeScenario.resultXml, log);
  }, [ activeScenario, log, onAccept ]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && phase === PHASE_IDLE && activeScenario) {
      e.preventDefault();
      handleGenerate();
    } else if (e.key === 'Escape' && phase === PHASE_PLAYING) {
      handleChange();
    }
  }, [ phase, activeScenario, handleGenerate, handleChange ]);

  const submittedTimestamp = useMemo(
    () => (submittedAt ? formatTimestamp(submittedAt) : ''),
    [ submittedAt ]
  );

  const headerSubtitle = processName || 'Untitled process';

  if (!wasEmptyOnOpen) {
    return (
      <div className={ css.aiSidePanel }>
        <ChatHeader subtitle={ headerSubtitle } onClose={ onClose } />
        <div className={ css.aiSidePanelLocked }>
          <p><strong>AI draft mode is only available on a fresh canvas.</strong></p>
          <p>Start from a new file (File → New → BPMN Diagram) to use the AI draft assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={ css.aiSidePanel }>
      <ChatHeader
        subtitle={ headerSubtitle }
        onClose={ onClose }
        onNewChat={ phase !== PHASE_IDLE ? resetState : undefined }
      />

      <div className={ css.chatMessages }>

        { phase === PHASE_IDLE && (
          <AssistantGreetingBubble
            scenarios={ SCENARIOS }
            activeScenarioId={ activeScenario && activeScenario.id }
            onSuggestionClick={ handleSuggestionClick }
          />
        ) }

        { phase !== PHASE_IDLE && submittedPrompt && (
          <UserMessageBubble text={ submittedPrompt } timestamp={ submittedTimestamp } />
        ) }

        { phase === PHASE_PLAYING && (
          <AssistantResponseBubble
            narration={ narration }
            log={ log }
            activeEntryIndex={ activeEntryIndex }
            onEntryClick={ onActivateEntry }
            interactive={ false }
            showThinking={ true }
          />
        ) }

        { phase === PHASE_READY && (
          <AssistantResponseBubble
            narration={ narration }
            log={ log }
            activeEntryIndex={ activeEntryIndex }
            onEntryClick={ onActivateEntry }
            interactive={ true }
            showThinking={ false }
            onChange={ handleChange }
            onAcceptEdit={ handleAcceptEdit }
          />
        ) }

        <div ref={ messagesEndRef } />
      </div>

      <ChatComposer
        value={ prompt }
        onChange={ setPrompt }
        onKeyDown={ handleKeyDown }
        onSend={ handleGenerate }
        canSend={ phase === PHASE_IDLE && !!activeScenario }
        disabled={ phase === PHASE_PLAYING }
        selectedElementId={ selectedElementId }
      />
    </div>
  );
}


// ---- Subcomponents ---------------------------------------------------------

function ChatHeader({ subtitle, onClose, onNewChat }) {
  return (
    <div className={ css.chatHeader }>
      <div className={ css.chatHeaderIcon } aria-hidden="true">✦</div>
      <div className={ css.chatHeaderInfo }>
        <div className={ css.chatHeaderTitleRow }>
          <span className={ css.chatHeaderTitle }>Camunda Copilot</span>
          <span className={ css.chatHeaderBadge }>Early access</span>
        </div>
        <div className={ css.chatHeaderSubtitle }>{ subtitle }</div>
      </div>
      <div className={ css.chatHeaderActions }>
        <button
          type="button"
          className={ css.chatHeaderIconButton }
          onClick={ onNewChat }
          disabled={ !onNewChat }
          aria-label="New chat"
          title="New chat"
        >+</button>
        <button
          type="button"
          className={ css.chatHeaderIconButton }
          aria-label="History"
          title="History (coming soon)"
          disabled
        >⟲</button>
        <button
          type="button"
          className={ css.chatHeaderIconButton }
          onClick={ onClose }
          aria-label="Close AI panel"
          title="Close"
        >✕</button>
      </div>
    </div>
  );
}

function AssistantGreetingBubble({ scenarios, activeScenarioId, onSuggestionClick }) {
  return (
    <div className={ classNames(css.chatMessage, css.chatMessageAssistant) }>
      <div className={ css.chatMessageBubble }>
        <p className={ css.chatMessageAssistantIntro }>
          Hi! I can draft a BPMN process for you. Pick a scenario or describe what you'd like to build.
        </p>
        <div className={ css.chatSuggestions }>
          <div className={ css.chatSuggestionsLabel }>Try one of these:</div>
          { scenarios.map(s => (
            <button
              key={ s.id }
              type="button"
              className={ classNames(css.chatSuggestion, { [css.isActive]: activeScenarioId === s.id }) }
              onClick={ () => onSuggestionClick(s) }
            >
              { s.chip.label }
            </button>
          )) }
        </div>
      </div>
    </div>
  );
}

function UserMessageBubble({ text, timestamp }) {
  return (
    <div className={ classNames(css.chatMessage, css.chatMessageUser) }>
      <div className={ css.chatMessageBubble }>{ text }</div>
      { timestamp && <div className={ css.chatMessageTimestamp }>{ timestamp }</div> }
    </div>
  );
}

function AssistantResponseBubble({
  narration, log, activeEntryIndex, onEntryClick,
  interactive, showThinking, onChange, onAcceptEdit
}) {
  return (
    <div className={ classNames(css.chatMessage, css.chatMessageAssistant) }>
      <div className={ css.chatMessageBubble }>
        { narration && (
          <p className={ css.chatMessageAssistantIntro }>{ narration }</p>
        ) }
        { log && log.length > 0 && (
          <CopilotActionLog
            entries={ log }
            interactive={ interactive }
            activeEntryIndex={ activeEntryIndex }
            onEntryClick={ (_entry, index) => onEntryClick && onEntryClick(index) }
          />
        ) }
        { showThinking && (
          <div className={ css.chatThinking } style={{ marginTop: log.length > 0 ? 8 : 0 }}>
            Thinking…
          </div>
        ) }
        { interactive && (
          <div className={ css.chatInlineActions }>
            <button
              type="button"
              className={ classNames(css.chatInlineButton, css.chatInlineButtonSecondary) }
              onClick={ onChange }
            >Change</button>
            <button
              type="button"
              className={ classNames(css.chatInlineButton, css.chatInlineButtonPrimary) }
              onClick={ onAcceptEdit }
            >Accept edit</button>
          </div>
        ) }
      </div>
    </div>
  );
}

function ChatComposer({ value, onChange, onKeyDown, onSend, canSend, disabled, selectedElementId }) {
  return (
    <div className={ css.chatComposer }>
      { selectedElementId && (
        <div className={ css.chatContextChip }>
          <span className={ css.chatContextChipLabel }>Element:</span>
          <span className={ css.chatContextChipValue }>{ selectedElementId }</span>
        </div>
      ) }
      <div className={ css.chatInputRow }>
        <textarea
          className={ css.chatInput }
          value={ value }
          placeholder="Type a message…"
          onChange={ e => onChange(e.target.value) }
          onKeyDown={ onKeyDown }
          rows={ 1 }
          disabled={ disabled }
        />
        <button
          type="button"
          className={ css.chatSendButton }
          onClick={ onSend }
          disabled={ !canSend }
          aria-label="Send message"
          title="Send"
        >↑</button>
      </div>
    </div>
  );
}
