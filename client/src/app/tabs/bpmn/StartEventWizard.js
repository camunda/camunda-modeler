/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useRef, useEffect } from 'react';

import * as css from './GuidedStart.less';


const TIMER_CHIPS = [
  { label: 'Every minute', value: 'PT1M' },
  { label: 'Every 5 min', value: 'PT5M' },
  { label: 'Every 15 min', value: 'PT15M' },
  { label: 'Every hour', value: 'PT1H' },
  { label: 'Every 6 hours', value: 'PT6H' },
  { label: 'Every day', value: 'P1D' },
  { label: 'Every week', value: 'P1W' },
  { label: 'Every month', value: 'P1M' },
];

/**
 * Step 2 wizard — collects the minimum required fields for a given start
 * event type before placing the element on canvas.
 *
 * @param {object} props
 * @param {string} props.eventTypeId - the type chosen in Step 1
 * @param {function} props.onConfirm - called with config object when user clicks "Add to canvas"
 * @param {function} props.onBack    - called when user goes back to the type picker
 * @param {function} props.onSkip   - called when user skips config (place with no config)
 */
export default function StartEventWizard({ eventTypeId, onConfirm, onBack, onSkip, startEventTemplates = [] }) {
  const sharedProps = { onConfirm, onBack, onSkip };

  switch (eventTypeId) {
  case 'timer': return <TimerWizard { ...sharedProps } />;
  case 'message': return <MessageWizard { ...sharedProps } />;
  case 'signal': return <SignalWizard { ...sharedProps } />;
  case 'webhook': return <WebhookWizard { ...sharedProps } templates={ startEventTemplates } />;
  default: return null;
  }
}


// ─── Shared shell ────────────────────────────────────────────────────────────

export function WizardShell({ heading, onBack, onSkip, onConfirm, confirmLabel = 'Add to canvas', confirmDisabled, children }) {

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onBack(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [ onBack ]);

  return (
    <>
      <div className={ css.backdrop } onClick={ onBack } />
      <div className={ css.dialog } role="dialog" aria-modal="true">

        <div className={ css.wizardHeader }>
          <button className={ css.backBtn } onClick={ onBack }>
            ← Back
          </button>
          <h3 className={ css.dialogHeading }>{ heading }</h3>
        </div>

        <div className={ css.wizardBody }>
          { children }
        </div>

        <div className={ css.wizardFooter }>
          { onSkip && (
            <button className={ css.skipLink } onClick={ onSkip }>
              Skip
            </button>
          ) }
          <button
            className={ css.wizardConfirmBtn }
            onClick={ onConfirm }
            disabled={ confirmDisabled }
          >
            { confirmLabel }
          </button>
        </div>

      </div>
    </>
  );
}


// ─── Timer ───────────────────────────────────────────────────────────────────

export function TimerWizard({ onConfirm, onBack, onSkip }) {
  const [ mode, setMode ] = useState('repeating');
  const [ selectedChip, setSelectedChip ] = useState('PT1H');
  const [ customValue, setCustomValue ] = useState('');
  const [ limit, setLimit ] = useState('');
  const [ dateTime, setDateTime ] = useState('');
  const [ name, setName ] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const isCustom = selectedChip === '__custom__';
  const intervalValue = isCustom ? customValue.trim() : selectedChip;

  const getTimerConfig = () => {
    if (mode === 'once') {
      if (!dateTime) return null;

      // datetime-local gives "2026-04-24T15:54" — pad to full seconds, no UTC conversion
      // Zeebe validates ISO 8601 date-time; milliseconds (.000) cause a validation error
      const iso = dateTime.length === 16 ? `${dateTime}:00` : dateTime;
      return { timer: { type: 'timeDate', value: iso } };
    }
    if (!intervalValue) return null;
    const prefix = (limit && !isNaN(limit) && parseInt(limit) > 0) ? `R${parseInt(limit)}/` : 'R/';
    return { timer: { type: 'timeCycle', value: `${prefix}${intervalValue}` } };
  };

  const timerConfig = getTimerConfig();

  return (
    <WizardShell
      heading="When should this process run?"
      onBack={ onBack }
      onSkip={ onSkip }
      onConfirm={ () => onConfirm({ ...timerConfig, name: name.trim() }) }
      confirmDisabled={ !timerConfig }
    >
      <p className={ css.fieldLabel }>
        Name <span className={ css.optionalBadge }>optional</span>
      </p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder="e.g. Daily report"
        value={ name }
        onChange={ e => setName(e.target.value) }
      />

      <p className={ css.sectionLabel }>Schedule</p>

      <div className={ css.segmentedControl }>
        <button
          className={ `${css.segmentBtn} ${mode === 'repeating' ? css.segmentBtnActive : ''}` }
          onClick={ () => setMode('repeating') }
        >Repeating</button>
        <button
          className={ `${css.segmentBtn} ${mode === 'once' ? css.segmentBtnActive : ''}` }
          onClick={ () => setMode('once') }
        >Run once</button>
      </div>

      { mode === 'repeating' && (
        <>
          <p className={ css.fieldLabel }>How often?</p>
          <div className={ css.chipGrid }>
            { TIMER_CHIPS.map(({ label, value }) => (
              <button
                key={ value }
                className={ `${css.chip} ${selectedChip === value ? css.chipActive : ''}` }
                onClick={ () => setSelectedChip(value) }
              >{ label }</button>
            )) }
            <button
              className={ `${css.chip} ${isCustom ? css.chipActive : ''}` }
              onClick={ () => setSelectedChip('__custom__') }
            >Custom…</button>
          </div>

          { isCustom && (
            <input
              className={ css.wizardInput }
              placeholder="ISO 8601 duration, e.g. PT30S"
              value={ customValue }
              onChange={ e => setCustomValue(e.target.value) }
              autoFocus
            />
          ) }

          <p className={ css.fieldLabel } style={ { marginTop: 16 } }>
            Repeat limit <span className={ css.optionalBadge }>optional</span>
          </p>
          <input
            className={ css.wizardInput }
            type="number"
            min="1"
            placeholder="Leave empty to repeat forever"
            value={ limit }
            onChange={ e => setLimit(e.target.value) }
          />
        </>
      ) }

      { mode === 'once' && (
        <>
          <p className={ css.fieldLabel }>Date and time</p>
          <input
            className={ css.wizardInput }
            type="datetime-local"
            value={ dateTime }
            onChange={ e => setDateTime(e.target.value) }
          />
          <p className={ css.fieldHelp }>
            The process starts exactly once at this date and time.
          </p>
        </>
      ) }
    </WizardShell>
  );
}


// ─── Message ─────────────────────────────────────────────────────────────────

export function MessageWizard({ onConfirm, onBack }) {
  const [ messageName, setMessageName ] = useState('');
  const [ name, setName ] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleConfirm = () => messageName.trim() && onConfirm({ messageName: messageName.trim(), name: name.trim() });

  return (
    <WizardShell
      heading="What message should start this process?"
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ handleConfirm }
      confirmDisabled={ !messageName.trim() }
    >
      <p className={ css.fieldLabel }>
        Name <span className={ css.optionalBadge }>optional</span>
      </p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder="e.g. Order received"
        value={ name }
        onChange={ e => setName(e.target.value) }
        onKeyDown={ e => e.key === 'Enter' && handleConfirm() }
      />

      <p className={ css.sectionLabel }>Message</p>

      <p className={ css.fieldLabel }>Message name</p>
      <input
        className={ css.wizardInput }
        placeholder="e.g. order-placed"
        value={ messageName }
        onChange={ e => setMessageName(e.target.value) }
        onKeyDown={ e => e.key === 'Enter' && handleConfirm() }
      />
      <p className={ css.fieldHelp }>
        The sender must use this exact name — think of it as a channel.
      </p>
      <div className={ css.infoBox }>
        ℹ️ <strong>Correlation:</strong> The sender can include a correlation key (e.g. order ID) to prevent duplicate instances. You configure that on the sending side.
      </div>
    </WizardShell>
  );
}


// ─── Signal ──────────────────────────────────────────────────────────────────

export function SignalWizard({ onConfirm, onBack }) {
  const [ signalName, setSignalName ] = useState('');
  const [ name, setName ] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleConfirm = () => signalName.trim() && onConfirm({ signalName: signalName.trim(), name: name.trim() });

  return (
    <WizardShell
      heading="What signal should start this process?"
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ handleConfirm }
      confirmDisabled={ !signalName.trim() }
    >
      <p className={ css.fieldLabel }>
        Name <span className={ css.optionalBadge }>optional</span>
      </p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder="e.g. Holiday announced"
        value={ name }
        onChange={ e => setName(e.target.value) }
        onKeyDown={ e => e.key === 'Enter' && handleConfirm() }
      />

      <p className={ css.sectionLabel }>Signal</p>

      <p className={ css.fieldLabel }>Signal name</p>
      <input
        className={ css.wizardInput }
        placeholder="e.g. company-holiday-announced"
        value={ signalName }
        onChange={ e => setSignalName(e.target.value) }
        onKeyDown={ e => e.key === 'Enter' && handleConfirm() }
      />
      <p className={ css.fieldHelp }>
        When any process or system broadcasts this signal, a new instance starts.
      </p>
      <div className={ css.infoBox }>
        ℹ️ <strong>Signals vs. messages:</strong> A signal is a broadcast — every process listening for this name starts at once. Use a message for 1-to-1 notifications.
      </div>
    </WizardShell>
  );
}


// ─── Webhook ─────────────────────────────────────────────────────────────────

export function WebhookWizard({ templates, onConfirm, onBack, onSkip }) {
  const [ selected, setSelected ] = useState(null);
  const [ name, setName ] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm({ template: selected, name: name.trim() });
  };

  // No templates installed — skip straight to canvas (connector not available)
  if (!templates || templates.length === 0) {
    return (
      <WizardShell
        heading="No connector templates installed"
        onBack={ onBack }
        onSkip={ onSkip }
        onConfirm={ () => onConfirm({}) }
        confirmLabel="Add to canvas"
      >
        <p className={ css.fieldHelp }>
          No inbound connector templates are installed. A plain Message Start Event will be placed —
          you can configure it further in the properties panel.
        </p>
      </WizardShell>
    );
  }

  return (
    <WizardShell
      heading="Which connector should trigger this?"
      onBack={ onBack }
      onSkip={ onSkip }
      onConfirm={ handleConfirm }
      confirmDisabled={ !selected }
    >
      <p className={ css.fieldLabel }>
        Name <span className={ css.optionalBadge }>optional</span>
      </p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder="e.g. New PR opened"
        value={ name }
        onChange={ e => setName(e.target.value) }
      />

      <p className={ css.sectionLabel }>Connector</p>

      <ul className={ css.templateList }>
        { templates.map(t => (
          <li
            key={ t.id }
            className={ `${css.templateItem} ${selected && selected.id === t.id ? css.templateItemSelected : ''}` }
            onClick={ () => setSelected(t) }
            tabIndex={ 0 }
            onKeyDown={ e => (e.key === 'Enter' || e.key === ' ') && setSelected(t) }
          >
            { t.icon
              ? <img className={ css.templateIcon } src={ t.icon.contents } alt="" />
              : <span className={ css.templateIconFallback }>⚡</span>
            }
            <span className={ css.templateName }>{ t.name }</span>
          </li>
        )) }
      </ul>
    </WizardShell>
  );
}

