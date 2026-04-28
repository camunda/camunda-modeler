/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';

import { APPEND_GROUPS, findLeaf } from './appendCatalog';

import { buildAppendResults } from './appendSearch';

import { buildSynonymIndex } from '../cloud-bpmn/connectors-context/synonymIndex';

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
 * @param {function} props.onQuickAppend - called for one-shot append from the search-results view (no Step 2)
 * @param {Array}    props.serviceTaskTemplates - pre-filtered templates for ServiceTaskWizard
 * @param {Array}    props.aiConnectorTemplates - pre-filtered templates for the AI connector leaf
 * @param {Array}    props.templates - full template corpus for search results
 * @param {string}   props.sourceElementType - BPMN type of the element being appended from (e.g. 'bpmn:Task')
 */
export default function AppendWizard({
  onConfirm,
  onClose,
  onQuickAppend,
  serviceTaskTemplates = [],
  aiConnectorTemplates = [],
  templates = [],
  sourceElementType
}) {
  const [ groupId, setGroupId ] = useState(null); // null = showing groups
  const [ leafId, setLeafId ] = useState(null); // null = no wizard open
  const [ nameOnly, setNameOnly ] = useState(null); // leaf being placed with just a name prompt
  const [ search, setSearch ] = useState('');

  // activeIdx — which search result is primary-focused (arrow-key nav).
  const [ activeIdx, setActiveIdx ] = useState(0);

  // activeGroupIdx — which group row is highlighted in the empty-state view.
  const [ activeGroupIdx, setActiveGroupIdx ] = useState(0);

  // primaryAction — 'append' or 'configure'; Tab flips this on the active row.
  const [ primaryAction, setPrimaryAction ] = useState('append');

  // Synonym Index for connectors-context prototype: lets the search corpus
  // match per-template `keywords` arrays and per-operation `synonyms` blocks
  // so phrases like "send message" surface Slack, Kafka, Twilio, etc. across
  // the catalog (Native Ops PRD pattern).
  const synonymIndex = useMemo(
    () => buildSynonymIndex(templates),
    [ templates ]
  );

  // searchResults is now a { sections: [...] } shape — each section carries
  // its own label and may have overflow (N more beyond the per-section cap).
  const searchResults = useMemo(
    () => buildAppendResults({ query: search, templates, sourceElementType, synonymIndex }),
    [ search, templates, sourceElementType, synonymIndex ]
  );

  // Flattened items in render order — used for arrow-key navigation.
  // Overflow pseudo-rows are NOT navigable (they're hints, not selectable).
  const flatResults = useMemo(
    () => searchResults.sections.flatMap(s => s.items),
    [ searchResults ]
  );

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [ onClose ]);

  // Reset search + active-group selection whenever we step between views so each screen starts fresh.
  useEffect(() => { setSearch(''); setActiveGroupIdx(0); }, [ groupId ]);

  // Reset active row whenever the query changes.
  useEffect(() => { setActiveIdx(0); setPrimaryAction('append'); }, [ search ]);

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

  // ─── Search results: flat ranked list across leaves + templates ────────
  //
  // Activates when the user types into the top-level search input. Drill-down
  // (groupId !== null) keeps its own in-group filter, and Step-2 wizards
  // (leafId / nameOnly) take priority, so this branch only wins when we're
  // at the top level with a non-empty query.
  if (!groupId && search.trim()) {
    return renderSearchResults();
  }

  function renderSearchResults() {

    // searchResults.sections are already in the canonical product order
    // (Elements → AI Agents → Connectors → RPA) with per-section cap applied.
    const { sections } = searchResults;
    const activeResult = flatResults[activeIdx] || null;

    const runAppend = (r) => {
      if (r.source === 'template') onQuickAppend({ template: r.template });
      else onQuickAppend({ elementId: r.leaf.elementId });
    };

    const runConfigure = (r) => {
      if (r.source === 'template') {

        // Templates have no Step-2 wizard; apply + open properties panel.
        onConfirm(inferElementIdForTemplate(r.template), { template: r.template });
      } else if (r.leaf.wizard) {
        setLeafId(r.leaf.elementId);
      } else {

        // No wizard: place + open properties panel (onConfirm does both).
        onConfirm(r.leaf.elementId, {});
      }
    };

    const runPrimary = () => {
      if (!activeResult) return;
      if (primaryAction === 'append') runAppend(activeResult);
      else runConfigure(activeResult);
    };

    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => Math.max(i - 1, 0));
      } else if (e.key === 'Tab') {

        // preventDefault is load-bearing: without it focus leaves the input
        // and the whole keyboard flow breaks.
        e.preventDefault();
        setPrimaryAction(p => p === 'append' ? 'configure' : 'append');
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runPrimary();
      }
    };

    return (
      <PickerShell
        heading="What happens next?"
        onClose={ onClose }
      >
        <input
          className={ css.searchInput }
          placeholder="Search"
          autoFocus
          value={ search }
          onChange={ e => setSearch(e.target.value) }
          onKeyDown={ onKeyDown }
          aria-activedescendant={ activeResult ? `append-result-${activeIdx}` : undefined }
          aria-controls="append-results"
        />
        <div id="append-results" role="listbox" className={ css.resultsList }>
          { sections.length === 0 && (
            <div className={ css.empty }>No matches for &quot;{ search }&quot;</div>
          ) }
          { sections.map(section => (
            <div key={ section.id } className={ css.section }>
              <div className={ css.resultsSectionLabel }>{ section.label }</div>
              { section.items.map(r => {
                const globalIdx = flatResults.indexOf(r);
                const isActive = globalIdx === activeIdx;
                return (
                  <div
                    key={ r.id }
                    id={ `append-result-${globalIdx}` }
                    role="option"
                    aria-selected={ isActive }
                    className={ isActive ? `${css.resultRow} ${css.resultRowActive}` : css.resultRow }
                    onMouseEnter={ () => setActiveIdx(globalIdx) }
                    onClick={ () => runAppend(r) }
                  >
                    <span className={ `${css.resultIcon} ${r.icon || ''}` } aria-hidden="true" />
                    <span className={ css.resultLabel }>{ r.label }</span>
                    { r.hint && <span className={ css.resultHint }>{ r.hint }</span> }
                    { isActive && (
                      <span className={ css.resultActions }>
                        <button
                          type="button"
                          className={ primaryAction === 'append' ? css.actionPrimary : css.actionSecondary }
                          onClick={ (e) => { e.stopPropagation(); runAppend(r); } }
                        >
                          Append { primaryAction === 'append' && <kbd>↵</kbd> }
                        </button>
                        <button
                          type="button"
                          className={ primaryAction === 'configure' ? css.actionPrimary : css.actionSecondary }
                          onClick={ (e) => { e.stopPropagation(); runConfigure(r); } }
                        >
                          Configure { primaryAction === 'configure' && <kbd>↵</kbd> }
                        </button>
                      </span>
                    ) }
                  </div>
                );
              }) }
              { section.overflow > 0 && (
                <div className={ css.overflowHint } aria-hidden="true">
                  +{ section.overflow } more — narrow your search
                </div>
              ) }
            </div>
          )) }
        </div>
        <div className={ css.footer }>
          <span>↑↓ navigate</span>
          <span>Tab switch action</span>
          <span>↵ { primaryAction === 'append' ? 'append' : 'configure' }</span>
          <span>esc close</span>
        </div>
      </PickerShell>
    );
  }

  function inferElementIdForTemplate(template) {

    // Pick a leaf elementId that matches the template's primary appliesTo.
    // Falls through to 'service-task' for connector-like templates.
    const appliesTo = template.appliesTo || [];
    if (appliesTo.includes('bpmn:UserTask')) return 'user-task';
    if (appliesTo.includes('bpmn:BusinessRuleTask')) return 'business-rule-task';
    if (appliesTo.includes('bpmn:CallActivity')) return 'call-activity';
    return 'service-task';
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

  // NOTE: when `search` is non-empty, renderSearchResults() handles the view.
  // This group-level filter now only runs for empty search, which means it's
  // a no-op. Kept for now to keep the diff small.
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
        onKeyDown={ (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveGroupIdx(i => Math.min(i + 1, APPEND_GROUPS.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveGroupIdx(i => Math.max(i - 1, 0));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            const g = APPEND_GROUPS[activeGroupIdx];
            if (g) setGroupId(g.id);
          }
        } }
      />
      { filteredGroups.length === 0
        ? <p className={ css.noResults }>No matches.</p>
        : (
          <ul className={ css.pickerList }>
            { filteredGroups.map((group, idx) => (
              <li
                key={ group.id }
                className={ idx === activeGroupIdx ? `${css.pickerItem} ${css.pickerItemActive}` : css.pickerItem }
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
