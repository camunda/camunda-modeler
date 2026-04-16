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
 * Overlay shown on an empty BPMN canvas offering two equal entry points:
 * - Guided start: pick a start event type
 * - Start with AI: open the AI assistance panel
 *
 * @param {object} props
 * @param {function} props.onStartEventSelect - called with the selected event type id
 * @param {function} props.onOpenAiPanel - called when "Start with AI" is clicked
 */
export default function EmptyCanvasOverlay({ onStartEventSelect, onOpenAiPanel }) {
  const [ dialogOpen, setDialogOpen ] = useState(false);

  const handleDialogClose = () => setDialogOpen(false);

  const handleSelect = (eventTypeId) => {
    setDialogOpen(false);
    onStartEventSelect(eventTypeId);
  };

  return (
    <div className={ css.overlay }>
      <div className={ css.cardRow }>

        <button
          className={ css.entryCard }
          onClick={ () => setDialogOpen(true) }
        >
          <span className={ css.cardIcon }>◎</span>
          <span className={ css.cardLabel }>How does your process start?</span>
          <span className={ css.cardHint }>Choose a trigger — form, schedule, message&hellip;</span>
        </button>

        <button
          className={ css.entryCard }
          onClick={ onOpenAiPanel }
        >
          <span className={ css.cardIcon }>✦</span>
          <span className={ css.cardLabel }>Start with AI</span>
          <span className={ css.cardHint }>Describe what you want to build</span>
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
