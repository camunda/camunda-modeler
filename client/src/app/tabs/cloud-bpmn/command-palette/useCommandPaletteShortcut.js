/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { useEffect } from 'react';

import { active as isInputActive } from '../../../../util/dom/isInput';

/**
 * useCommandPaletteShortcut — window-level CMD+E / Ctrl+E listener that opens
 * the palette. We deliberately DON'T route through KeyboardBindings.js (that's
 * menu-accelerator territory). Also supports mode hotkeys ⌘1..⌘4.
 *
 * Guard: only activates when the user isn't typing in an <input>, <textarea>,
 * contentEditable element, or the properties-panel FEEL editor.
 */
export default function useCommandPaletteShortcut({
  onOpen,
  onClose,
  isOpen,
  onModeHotkey
}) {
  useEffect(() => {
    const handler = (e) => {
      const meta = e.metaKey || e.ctrlKey;

      // Esc closes when open.
      if (isOpen && e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
        return;
      }

      if (!meta) return;

      const key = e.key.toLowerCase();

      // CMD/Ctrl + E — open palette.
      if (key === 'e') {
        if (isInputActive()) return;
        e.preventDefault();
        onOpen && onOpen();
        return;
      }

      // CMD/Ctrl + 1..4 — mode switches.
      if ([ '1', '2', '3', '4' ].includes(e.key)) {
        if (isInputActive()) return;
        if (onModeHotkey) {
          e.preventDefault();
          const modes = [ 'design', 'implement', 'simulate', 'test' ];
          onModeHotkey(modes[parseInt(e.key, 10) - 1]);
        }
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [ onOpen, onClose, isOpen, onModeHotkey ]);
}
