/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState } from 'react';

import StartEventDialog from './StartEventDialog';

import * as css from './GuidedStart.less';


/**
 * Overlay shown on an empty BPMN canvas offering guided entry points:
 * - "Start a process" opens a dialog to choose a start event type
 * - "Start with AI" opens the AI side panel
 *
 * @param {object} props
 * @param {function} props.onStartEventSelect - called with the selected event type id
 * @param {function} props.onOpenAiPanel - called when "Start with AI" is clicked
 */
export default function EmptyCanvasOverlay({ onStartEventSelect, onOpenAiPanel }) {
  const [ dialogOpen, setDialogOpen ] = useState(false);

  const handleStartProcess = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  const handleSelect = (eventTypeId) => {
    setDialogOpen(false);
    onStartEventSelect(eventTypeId);
  };

  return (
    <div className={ css.overlay }>
      <div className={ css.overlayContent }>
        <button
          className={ css.primaryBtn }
          onClick={ handleStartProcess }
        >
          + Start a process
        </button>

        <button
          className={ css.aiBtn }
          onClick={ onOpenAiPanel }
        >
          ✦ Start with AI
        </button>
      </div>

      { dialogOpen && (
        <StartEventDialog
          onSelect={ handleSelect }
          onClose={ handleDialogClose }
        />
      ) }
    </div>
  );
}
