/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useEffect, useRef } from 'react';

import { APPEND_GROUPS, findLeaf } from './appendCatalog';

import { WizardShell } from './StartEventWizard';

import {
  UserTaskWizard,
  ServiceTaskWizard,
  CallActivityWizard,
  IntermediateEventWizard,
  CatalogStubWizard
} from './AppendWizardSteps';

import * as css from './GuidedStart.less';

/**
 * Renders a catalog icon. `bpmn-icon-*` strings use the bpmn-font (loaded
 * globally via _modeling.less); anything else falls through as text.
 */
function PickerIcon({ icon }) {
  if (typeof icon === 'string' && icon.startsWith('bpmn-icon-')) {
    return <i className={ icon } aria-hidden="true" />;
  }
  return <>{ icon }</>;
}

/**
 * Two-step dialog opened when the user clicks the primary "+" in the context pad.
 *
 * Step 1: group picker → drill-down leaves
 * Step 2: per-element mini-wizard (or immediate place for leaves with no wizard)
 *
 * @param {object}   props
 * @param {function} props.onConfirm  - called with (elementId, config)
 * @param {function} props.onClose    - called when the dialog should close (Escape, backdrop, or back from step 1)
 * @param {Array}    props.serviceTaskTemplates - pre-filtered templates for ServiceTaskWizard
 * @param {Array}    props.aiConnectorTemplates - pre-filtered templates for the AI connector leaf
 */
export default function AppendWizard({ onConfirm, onClose, serviceTaskTemplates = [], aiConnectorTemplates = [] }) {
  const [ groupId, setGroupId ] = useState(null); // null = showing groups
  const [ leafId, setLeafId ] = useState(null); // null = no wizard open
  const [ nameOnly, setNameOnly ] = useState(null); // leaf being placed with just a name prompt
  const [ search, setSearch ] = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [ onClose ]);

  // Reset search whenever we step between views so each screen starts fresh.
  useEffect(() => { setSearch(''); }, [ groupId ]);

  // ─── Step 2: leaf with a full wizard ────────────────────────────────────

  if (leafId) {
    const ctx = findLeaf(leafId);
    if (!ctx) return null;
    const { leaf } = ctx;

    const onBack = () => setLeafId(null);
    const onDone = (config) => { setLeafId(null); onConfirm(leaf.elementId, config); };

    if (leaf.wizard === 'user-task') {
      return <UserTaskWizard onConfirm={ onDone } onBack={ onBack } />;
    }
    if (leaf.wizard === 'service-task') {
      const templates = leaf.elementId === 'ai-connector' ? aiConnectorTemplates : serviceTaskTemplates;
      const heading = leaf.elementId === 'ai-connector'
        ? 'Which AI action should run?'
        : 'Which integration should this task use?';
      return (
        <ServiceTaskWizard
          templates={ templates }
          heading={ heading }
          onConfirm={ onDone }
          onBack={ onBack }
        />
      );
    }
    if (leaf.wizard === 'call-activity') {
      return <CallActivityWizard onConfirm={ onDone } onBack={ onBack } />;
    }
    if (leaf.wizard === 'intermediate-event') {
      return <IntermediateEventWizard onConfirm={ onDone } onBack={ onBack } />;
    }
    if (leaf.wizard === 'catalog-stub') {
      return (
        <CatalogStubWizard
          label={ leaf.label }
          onConfirm={ () => { setLeafId(null); onClose(); } }
          onBack={ onBack }
        />
      );
    }
    return null;
  }

  // ─── Step 2: leaf with only a name prompt (no mandatory config) ─────────

  if (nameOnly) {
    return (
      <NamePromptWizard
        leaf={ nameOnly }
        onBack={ () => setNameOnly(null) }
        onConfirm={ (config) => { const id = nameOnly.elementId; setNameOnly(null); onConfirm(id, config); } }
      />
    );
  }

  // ─── Step 1: drill-down leaves ──────────────────────────────────────────

  if (groupId) {
    const group = APPEND_GROUPS.find(g => g.id === groupId);
    if (!group) return null;

    const handleLeaf = (leaf) => {
      if (leaf.wizard) setLeafId(leaf.elementId);
      else setNameOnly(leaf);
    };

    const q = search.trim().toLowerCase();
    const filteredLeaves = q
      ? group.leaves.filter(l =>
        l.label.toLowerCase().includes(q) ||
        (l.hint && l.hint.toLowerCase().includes(q))
      )
      : group.leaves;

    return (
      <PickerShell
        heading={ group.label }
        onBack={ () => setGroupId(null) }
        onClose={ onClose }
      >
        <input
          className={ css.searchInput }
          placeholder="Search"
          value={ search }
          onChange={ e => setSearch(e.target.value) }
          autoFocus
        />
        { filteredLeaves.length === 0
          ? <p className={ css.noResults }>No matches.</p>
          : (
            <ul className={ css.pickerList }>
              { filteredLeaves.map(leaf => (
                <li
                  key={ leaf.elementId }
                  className={ css.pickerItem }
                  onClick={ () => handleLeaf(leaf) }
                  tabIndex={ 0 }
                  onKeyDown={ e => (e.key === 'Enter' || e.key === ' ') && handleLeaf(leaf) }
                >
                  <span className={ css.pickerIcon }>
                    <PickerIcon icon={ leaf.icon || group.icon } />
                  </span>
                  <div className={ css.pickerText }>
                    <span className={ css.pickerTitle }>{ leaf.label }</span>
                    { leaf.hint && <span className={ css.pickerDesc }>{ leaf.hint }</span> }
                  </div>
                  <span className={ css.pickerArrow }>→</span>
                </li>
              )) }
            </ul>
          )
        }
      </PickerShell>
    );
  }

  // ─── Step 1: top-level groups ───────────────────────────────────────────

  const q = search.trim().toLowerCase();
  const filteredGroups = q
    ? APPEND_GROUPS.filter(g =>
      g.label.toLowerCase().includes(q) ||
      g.outcome.toLowerCase().includes(q) ||
      g.leaves.some(l =>
        l.label.toLowerCase().includes(q) ||
        (l.hint && l.hint.toLowerCase().includes(q))
      )
    )
    : APPEND_GROUPS;

  return (
    <PickerShell
      heading="What happens next?"
      onBack={ null }
      onClose={ onClose }
    >
      <input
        className={ css.searchInput }
        placeholder="Search"
        value={ search }
        onChange={ e => setSearch(e.target.value) }
        autoFocus
      />
      { filteredGroups.length === 0
        ? <p className={ css.noResults }>No matches.</p>
        : (
          <ul className={ css.pickerList }>
            { filteredGroups.map(group => (
              <li
                key={ group.id }
                className={ css.pickerItem }
                onClick={ () => setGroupId(group.id) }
                tabIndex={ 0 }
                onKeyDown={ e => (e.key === 'Enter' || e.key === ' ') && setGroupId(group.id) }
              >
                <span className={ css.pickerIcon }>
                  <PickerIcon icon={ group.icon } />
                </span>
                <div className={ css.pickerText }>
                  <span className={ css.pickerTitle }>{ group.label }</span>
                  <span className={ css.pickerDesc }>{ group.outcome }</span>
                </div>
                <span className={ css.pickerArrow }>→</span>
              </li>
            )) }
          </ul>
        )
      }
    </PickerShell>
  );
}


// ─── Shells ─────────────────────────────────────────────────────────────────

function PickerShell({ heading, subheading, onBack, onClose, children }) {
  return (
    <>
      <div className={ css.backdrop } onClick={ onClose } />
      <div className={ css.dialog } role="dialog" aria-modal="true">
        <div className={ css.wizardHeader }>
          { onBack && (
            <button className={ css.backBtn } onClick={ onBack }>← Back</button>
          ) }
          <h3 className={ css.dialogHeading }>{ heading }</h3>
          { subheading && <p className={ css.fieldHelp } style={ { margin: '0 0 12px' } }>{ subheading }</p> }
        </div>
        { children }
      </div>
    </>
  );
}


// ─── Name-only wizard (leaves without a mandatory Step 2) ──────────────────

function NamePromptWizard({ leaf, onConfirm, onBack }) {
  const [ name, setName ] = useState('');
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current && nameRef.current.focus(); }, []);

  const handleConfirm = () => onConfirm({ name: name.trim() });

  return (
    <WizardShell
      heading={ `Add a ${leaf.label.toLowerCase()}` }
      onBack={ onBack }
      onSkip={ null }
      onConfirm={ handleConfirm }
    >
      <p className={ css.fieldLabel }>Name <span className={ css.optionalBadge }>optional</span></p>
      <input
        ref={ nameRef }
        className={ css.wizardInput }
        placeholder={ `e.g. ${leaf.label}` }
        value={ name }
        onChange={ e => setName(e.target.value) }
        onKeyDown={ e => e.key === 'Enter' && handleConfirm() }
      />
      { leaf.hint && <p className={ css.fieldHelp }>{ leaf.hint }</p> }
    </WizardShell>
  );
}
