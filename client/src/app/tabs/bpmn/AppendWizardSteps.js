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

import {
  WizardShell,
  TimerWizard,
  MessageWizard,
  SignalWizard
} from './StartEventWizard';

import * as css from './GuidedStart.less';

// ---- Static mock form list (Hub integration deferred) -----------------------

const MOCK_FORMS = [
  { id: 'approval-form', name: 'Approval request', icon: '📝' },
  { id: 'order-form', name: 'Order intake', icon: '🧾' },
  { id: 'onboarding-form', name: 'Employee onboarding', icon: '👤' },
  { id: 'contact-form', name: 'Contact details', icon: '✉️' }
];


// ─── User Task ───────────────────────────────────────────────────────────────

/**
 * Step 2 for User Task — name + form selection.
 */
export function UserTaskWizard({ onConfirm, onBack }) {
  const [ name, setName ] = useState('');
  const [ form, setForm ] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleConfirm = () => {
    onConfirm({
      name: name.trim(),
      ...(form ? { form: { formId: form.id, name: form.name } } : {})
    });
  };

  return (
    <WizardShell
      heading="What does the person need to do?"
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ handleConfirm }
    >
      <p className={ css.fieldLabel }>Name <span className={ css.optionalBadge }>optional</span></p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder="e.g. Review request"
        value={ name }
        onChange={ e => setName(e.target.value) }
        onKeyDown={ e => e.key === 'Enter' && handleConfirm() }
      />

      <p className={ css.sectionLabel }>Form</p>

      <ul className={ css.templateList }>
        { MOCK_FORMS.map(f => (
          <li
            key={ f.id }
            className={ `${css.templateItem} ${form && form.id === f.id ? css.templateItemSelected : ''}` }
            onClick={ () => setForm(f) }
            tabIndex={ 0 }
            onKeyDown={ e => (e.key === 'Enter' || e.key === ' ') && setForm(f) }
          >
            <span className={ css.templateIconFallback }>{ f.icon }</span>
            <span className={ css.templateName }>{ f.name }</span>
          </li>
        )) }
      </ul>
      <p className={ css.fieldHelp }>
        Pick a form to show the assignee — you can change or build one later in the properties panel.
      </p>
    </WizardShell>
  );
}


// ─── Service Task / Connector ────────────────────────────────────────────────

/**
 * Step 2 for Service Task / Connector / AI Connector — name + template picker.
 *
 * @param {Array}  props.templates  - pre-filtered list of element templates
 * @param {string} props.heading    - contextual heading (varies by group)
 */
export function ServiceTaskWizard({ templates, onConfirm, onBack, heading = 'Which integration should this task use?' }) {
  const [ selected, setSelected ] = useState(null);
  const [ name, setName ] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleConfirm = () => {
    onConfirm({
      name: name.trim(),
      ...(selected ? { template: selected } : {})
    });
  };

  // No templates installed — place a plain service task
  if (!templates || templates.length === 0) {
    return (
      <WizardShell
        heading="No connector templates installed"
        onBack={ onBack }
        onSkip={ null }
        onConfirm={ () => onConfirm({ name: name.trim() }) }
      >
        <p className={ css.fieldLabel }>Name <span className={ css.optionalBadge }>optional</span></p>
        <input
          ref={ nameRef }
          className={ css.wizardInput }
          placeholder="e.g. Send confirmation"
          value={ name }
          onChange={ e => setName(e.target.value) }
        />
        <p className={ css.fieldHelp }>
          A plain service task will be placed — you can configure it or install connector templates later.
        </p>
      </WizardShell>
    );
  }

  return (
    <WizardShell
      heading={ heading }
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ handleConfirm }
      confirmDisabled={ !selected }
    >
      <p className={ css.fieldLabel }>Name <span className={ css.optionalBadge }>optional</span></p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder="e.g. Notify customer"
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


// ─── Call Activity ───────────────────────────────────────────────────────────

/**
 * Step 2 for Call Activity — name + called process ID.
 */
export function CallActivityWizard({ onConfirm, onBack }) {
  const [ name, setName ] = useState('');
  const [ calledProcess, setCalledProcess ] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleConfirm = () => {
    if (!calledProcess.trim()) return;
    onConfirm({
      name: name.trim(),
      calledElement: calledProcess.trim()
    });
  };

  return (
    <WizardShell
      heading="Which process should be called?"
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ handleConfirm }
      confirmDisabled={ !calledProcess.trim() }
    >
      <p className={ css.fieldLabel }>Name <span className={ css.optionalBadge }>optional</span></p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder="e.g. Run approval"
        value={ name }
        onChange={ e => setName(e.target.value) }
      />

      <p className={ css.sectionLabel }>Called process</p>

      <p className={ css.fieldLabel }>Process ID</p>
      <input
        className={ css.wizardInput }
        placeholder="e.g. approval-process"
        value={ calledProcess }
        onChange={ e => setCalledProcess(e.target.value) }
        onKeyDown={ e => e.key === 'Enter' && handleConfirm() }
      />
      <p className={ css.fieldHelp }>
        The ID of the BPMN process to invoke. It must be deployed separately.
      </p>
    </WizardShell>
  );
}


// ─── Intermediate Event ──────────────────────────────────────────────────────

/**
 * Step 2 for Intermediate Event — trigger chooser, then delegate to the
 * existing start-event wizards (Timer / Message / Signal).
 */
export function IntermediateEventWizard({ onConfirm, onBack }) {
  const [ trigger, setTrigger ] = useState(null);

  if (trigger === 'timer') {
    return (
      <TimerWizard
        onConfirm={ config => onConfirm({ ...config, _trigger: 'timer' }) }
        onBack={ () => setTrigger(null) }
        onSkip={ () => onConfirm({ _trigger: 'timer' }) }
      />
    );
  }
  if (trigger === 'message') {
    return (
      <MessageWizard
        onConfirm={ config => onConfirm({ ...config, _trigger: 'message' }) }
        onBack={ () => setTrigger(null) }
      />
    );
  }
  if (trigger === 'signal') {
    return (
      <SignalWizard
        onConfirm={ config => onConfirm({ ...config, _trigger: 'signal' }) }
        onBack={ () => setTrigger(null) }
      />
    );
  }

  return (
    <WizardShell
      heading="What should the process wait for?"
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ () => {} }
      confirmDisabled={ true }
    >
      <p className={ css.fieldHelp } style={ { marginBottom: 12 } }>
        Pick a trigger to continue.
      </p>
      <ul className={ css.templateList }>
        <li className={ css.templateItem } onClick={ () => setTrigger('timer') } tabIndex={ 0 }>
          <span className={ css.templateIconFallback }>⏱</span>
          <span className={ css.templateName }>Timer — wait for a duration or date</span>
        </li>
        <li className={ css.templateItem } onClick={ () => setTrigger('message') } tabIndex={ 0 }>
          <span className={ css.templateIconFallback }>✉️</span>
          <span className={ css.templateName }>Message — wait for an inbound message</span>
        </li>
        <li className={ css.templateItem } onClick={ () => setTrigger('signal') } tabIndex={ 0 }>
          <span className={ css.templateIconFallback }>📡</span>
          <span className={ css.templateName }>Signal — wait for a broadcast</span>
        </li>
      </ul>
    </WizardShell>
  );
}


// ─── Catalog stub ────────────────────────────────────────────────────────────

export function CatalogStubWizard({ onConfirm, onBack, label }) {
  return (
    <WizardShell
      heading="Coming soon"
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ () => onConfirm(null) }
      confirmLabel="Got it"
    >
      <p className={ css.fieldHelp }>
        <strong>{ label || 'This pattern' }</strong> is part of the upcoming Hub integration.
        Reusable building blocks will appear here so you can drop proven patterns into any process.
      </p>
      <p className={ css.fieldHelp } style={ { marginTop: 12 } }>
        Nothing will be added to the canvas.
      </p>
    </WizardShell>
  );
}
