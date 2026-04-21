/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useState } from 'react';

import CommandPalette from './CommandPalette';
import useCommandPaletteShortcut from './useCommandPaletteShortcut';

/**
 * CommandPaletteHost — functional wrapper that lets the (class-based)
 * BpmnEditor opt into the command palette without turning into a hook host.
 *
 * Owns the open/close state and binds the CMD+E and ⌘1..⌘4 shortcuts.
 *
 * Also forwards a ref-style `registerOpen` so callers (e.g. the rail search
 * button) can trigger the palette imperatively.
 */
export default function CommandPaletteHost(props) {
  const { modeler, modeController, openAiPanel, templates, registerOpen } = props;

  const [ open, setOpen ] = useState(false);

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const handleModeHotkey = useCallback((nextMode) => {
    if (modeController) modeController.set(nextMode);
  }, [ modeController ]);

  useCommandPaletteShortcut({
    onOpen: handleOpen,
    onClose: handleClose,
    isOpen: open,
    onModeHotkey: handleModeHotkey
  });

  // Expose the open function to parent (BpmnEditor passes a ref callback).
  React.useEffect(() => {
    if (registerOpen) registerOpen(handleOpen);
    return () => registerOpen && registerOpen(null);
  }, [ registerOpen, handleOpen ]);

  return (
    <CommandPalette
      open={ open }
      onClose={ handleClose }
      modeler={ modeler }
      modeController={ modeController }
      openAiPanel={ openAiPanel }
      templates={ templates }
    />
  );
}
