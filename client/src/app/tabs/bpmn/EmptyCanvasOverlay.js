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
import StartEventWizard from './StartEventWizard';

import * as css from './GuidedStart.less';

// Types that have a Step 2 wizard (process name is collected there)
const WIZARD_TYPES = new Set([ 'timer', 'message', 'signal', 'webhook' ]);

/**
 * Overlay shown on an empty BPMN canvas offering two equal entry points.
 * Manages a two-step flow: type picker (Step 1) → mini-wizard (Step 2).
 * Form and manual trigger types are placed immediately with no wizard.
 *
 * @param {object} props
 * @param {function} props.onStartEventSelect - called with (eventTypeId, config)
 * @param {function} props.onOpenAiPanel
 * @param {Array}    props.startEventTemplates
 */
export default function EmptyCanvasOverlay({ onStartEventSelect, onOpenAiPanel, startEventTemplates = [] }) {
  const [ dialogOpen, setDialogOpen ] = useState(false);
  const [ wizardType, setWizardType ] = useState(null);

  // Step 1 → Step 2 or immediate placement
  const handleTypeSelect = (typeId) => {
    setDialogOpen(false);
    if (WIZARD_TYPES.has(typeId)) {
      setWizardType(typeId);
    } else {
      // form / manual — place immediately, no wizard
      onStartEventSelect(typeId, {});
    }
  };

  // Step 2 confirm — place with collected config
  const handleWizardConfirm = (config) => {
    const type = wizardType;
    setWizardType(null);
    onStartEventSelect(type, config);
  };

  // Step 2 → Step 1
  const handleWizardBack = () => {
    setWizardType(null);
    setDialogOpen(true);
  };

  // Skip wizard — place with no config
  const handleWizardSkip = () => {
    const type = wizardType;
    setWizardType(null);
    onStartEventSelect(type, {});
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
          onSelect={ handleTypeSelect }
          onClose={ () => setDialogOpen(false) }
        />
      ) }

      { wizardType && (
        <StartEventWizard
          eventTypeId={ wizardType }
          onConfirm={ handleWizardConfirm }
          onBack={ handleWizardBack }
          onSkip={ handleWizardSkip }
          startEventTemplates={ startEventTemplates }
        />
      ) }
    </div>
  );
}
