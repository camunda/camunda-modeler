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
  buildCommandIndex,
  rankCommands,
  groupCommands,
  loadRecents,
  pushRecent,
  GROUPS
} from './commandIndex';

import { useMode } from '../mode/modeController';

import * as css from './CommandPalette.less';

/**
 * CommandPalette — CMD+E / Ctrl+E overlay with fuzzy search over commands.
 *
 * Props:
 *   open          — controlled open/close
 *   onClose       — called when user closes (Esc, backdrop click, after run)
 *   modeler       — bpmn-js instance (passed to command run())
 *   modeController— shared mode controller
 *   openAiPanel   — called by the "Ask Copilot" command
 *   templates     — element templates to include in the palette index
 */
export default function CommandPalette(props) {
  const { open, onClose, modeler, modeController, openAiPanel, templates = [] } = props;

  const { mode, setMode } = useMode(modeController);

  const inputRef = useRef(null);
  const [ query, setQuery ] = useState('');
  const [ activeIdx, setActiveIdx ] = useState(0);

  // Build the index once per open (cheap enough).
  const commands = useMemo(
    () => buildCommandIndex({ modeler, mode, templates }),
    [ modeler, mode, templates, open ]
  );

  const { flat } = useMemo(
    () => rankCommands(commands, query, { mode, recentsIds: loadRecents() }),
    [ commands, query, mode ]
  );

  const grouped = useMemo(() => groupCommands(flat), [ flat ]);

  // Reset & auto-focus on open.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIdx(0);
    const t = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [ open ]);

  // Keep activeIdx in range when the list shrinks.
  useEffect(() => {
    if (activeIdx >= flat.length) setActiveIdx(Math.max(0, flat.length - 1));
  }, [ flat.length, activeIdx ]);

  if (!open) return null;

  const runCommand = (cmd) => {
    if (!cmd || cmd.disabled) return;
    pushRecent(cmd.id);
    onClose && onClose();

    // Defer so the overlay unmounts before tools activate / shapes place.
    requestAnimationFrame(() => {
      try {
        cmd.run({ modeler, setMode, openAiPanel });
      } catch (e) {

        // Swallow — prototype shouldn't crash the editor.
      }
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose && onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, Math.max(0, flat.length - 1)));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(flat[activeIdx]);
      return;
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose && onClose();
  };

  let runningIdx = 0;

  return (
    <div className={ css.backdrop } onClick={ handleBackdropClick } role="presentation">
      <div
        className={ css.palette }
        role="dialog"
        aria-label="Command palette"
        onKeyDown={ handleKeyDown }
      >
        <div className={ css.inputRow }>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M20 20l-4.5-4.5" />
          </svg>
          <input
            ref={ inputRef }
            type="text"
            className={ css.input }
            value={ query }
            placeholder="Search for shapes, templates, actions, modes…"
            onChange={ (e) => { setQuery(e.target.value); setActiveIdx(0); } }
          />
          <kbd className={ css.inputHint }>esc</kbd>
        </div>

        <div className={ css.results }>
          { flat.length === 0 && (
            <div className={ css.empty }>No matches for &ldquo;{ query }&rdquo;</div>
          ) }

          { GROUPS.map(group => {
            const items = grouped[group.id] || [];
            if (!items.length) return null;
            return (
              <div key={ group.id } className={ css.group }>
                <div className={ css.groupLabel }>{ group.label }</div>
                { items.map(cmd => {
                  const idx = runningIdx++;
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={ cmd.id }
                      type="button"
                      className={ `${css.item} ${isActive ? css['item--active'] : ''} ${cmd.disabled ? css['item--disabled'] : ''}` }
                      onMouseEnter={ () => setActiveIdx(idx) }
                      onClick={ () => runCommand(cmd) }
                      disabled={ cmd.disabled }
                    >
                      <span className={ css.itemLabel }>{ cmd.label }</span>
                      { cmd.hint && <kbd className={ css.itemHint }>{ cmd.hint }</kbd> }
                    </button>
                  );
                }) }
              </div>
            );
          }) }
        </div>

        <div className={ css.footer }>
          <span><kbd>↑</kbd> <kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
