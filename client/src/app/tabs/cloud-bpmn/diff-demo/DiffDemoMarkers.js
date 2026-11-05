/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { diffWordsWithSpace } from 'diff';

import { Check, Undo2 } from '@camunda/design-system/icons';

import './DiffDemoMarkers.css';

export const TYPES = [ 'changed', 'added', 'removed' ];

export const LABELS = {
  added: 'Added',
  changed: 'Changed',
  removed: 'Removed'
};

const REVERT_ICON = renderToStaticMarkup(React.createElement(Undo2, { size: 16 }));
const APPROVE_ICON = renderToStaticMarkup(React.createElement(Check, { size: 16 }));

const CHANGE_ATTR = 'data-diff-demo-change';
const OWNER_ATTR = 'data-diff-demo-owner';
const LABEL_ATTR = 'data-diff-demo-label';
const PLACEHOLDER_ATTR = 'data-diff-demo-placeholder';
const INLINE_ATTR = 'data-diff-demo-inline';
const HIDDEN_ATTR = 'data-diff-demo-hidden';
const GHOST_ATTR = 'data-diff-demo-ghost';
const GROUP_COUNTS_ATTR = 'data-diff-demo-group-counts';

const CANVAS_MARKER = 'diff-demo-changed';

// unchanged text around changes kept visible in inline diffs
const CONTEXT_LENGTH = 24;

/**
 * PROTOTYPE: highlights recent changes in the properties panel.
 *
 * - groups (sections) get color coded change counts in their header
 * - entries get a colored bar, a tag and (for changed/removed) a
 *   restore button, injected into the DOM and kept up to date via
 *   a MutationObserver
 * - changed entries with an `oldValue` show an inline diff in place of the
 *   field until clicked (edit mode) and again once focus leaves the field
 *
 * Fire `diffDemo.setChanges` with `{ changes }` to show markers, or with
 * `{ changes: null }` to hide them. Fires `diffDemo.elementChanges` with
 * the changes of the element shown in the properties panel; fire
 * `diffDemo.reveal` with `{ change }` to scroll a change into view.
 */
export default function DiffDemoMarkers(eventBus, injector) {
  this._injector = injector;
  this._eventBus = eventBus;

  this._changes = null;
  this._element = null;
  this._scheduled = null;
  this._container = null;

  // IDs of inline diff entries currently being edited
  this._editing = new Set();

  this._handleClick = this._handleClick.bind(this);
  this._handleFocusOut = this._handleFocusOut.bind(this);

  this._observer = new MutationObserver(() => this._scheduleDecorate());

  eventBus.on('diffDemo.setChanges', ({ changes }) => {
    this._updateCanvasMarkers(this._changes, changes);

    this._changes = changes;
    this._editing.clear();
    this._update();
  });

  eventBus.on('propertiesPanel.updated', ({ element }) => {
    if (element !== this._element) {
      this._editing.clear();
    }

    this._element = element;
    this._update();
  });

  eventBus.on('diffDemo.reveal', ({ change }) => {
    this._reveal(change);
  });

  eventBus.on('diagram.destroy', () => {
    this._observer.disconnect();
    cancelAnimationFrame(this._scheduled);

    if (this._container) {
      this._container.removeEventListener('click', this._handleClick, true);
      this._container.removeEventListener('focusout', this._handleFocusOut);
    }
  });
}

DiffDemoMarkers.$inject = [ 'eventBus', 'injector' ];

/**
 * Demo only: mark changed elements on the canvas, no diffing behind it.
 */
DiffDemoMarkers.prototype._updateCanvasMarkers = function(oldChanges, newChanges) {
  const canvas = this._injector.get('canvas');
  const elementRegistry = this._injector.get('elementRegistry');

  const toggle = (changes, add) => {
    Object.keys(changes || {}).forEach(id => {
      const element = elementRegistry.get(id);

      if (element) {
        canvas[ add ? 'addMarker' : 'removeMarker' ](element, CANVAS_MARKER);
      }
    });
  };

  toggle(oldChanges, false);
  toggle(newChanges, true);
};

DiffDemoMarkers.prototype._getContainer = function() {
  const propertiesPanel = this._injector.get('propertiesPanel', false);

  return propertiesPanel && propertiesPanel._container;
};

/**
 * @return {Object|null} element shown in the properties panel
 */
DiffDemoMarkers.prototype.getElement = function() {
  return this._element;
};

/**
 * @return {Array<import('./DiffDemoChanges').Change>}
 */
DiffDemoMarkers.prototype.getElementChanges = function() {
  return this._getElementChanges();
};

/**
 * @return {Array<import('./DiffDemoChanges').Change>}
 */
DiffDemoMarkers.prototype._getElementChanges = function() {
  return (this._changes && this._element && this._changes[ this._element.id ]) || [];
};

DiffDemoMarkers.prototype._update = function() {
  this._eventBus.fire('diffDemo.elementChanges', {
    element: this._element,
    changes: this._getElementChanges()
  });

  const container = this._getContainer();

  if (!container) {
    return;
  }

  if (container !== this._container) {
    this._container = container;

    container.addEventListener('click', this._handleClick, true);
    container.addEventListener('focusout', this._handleFocusOut);
  }

  this._observer.disconnect();
  this._observer.observe(container, { childList: true, subtree: true });

  this._scheduleDecorate();
};

/**
 * Open the section (and list item) of a change and scroll it into view,
 * without focusing it (would hide inline diffs).
 */
DiffDemoMarkers.prototype._reveal = async function(change) {
  const container = this._getContainer();

  if (!container || !change) {
    return;
  }

  const groupSelector = `[data-group-id="group-${ CSS.escape(change.group) }"]`;

  const getGroupHeader = () => container.querySelector(`${ groupSelector } > .bio-properties-panel-group-header`);

  const getNode = () => change.ghost
    ? container.querySelector(`[${ GHOST_ATTR }="${ CSS.escape(getGhostKey(change)) }"]`)
    : change.entry && container.querySelector(`[data-entry-id="${ CSS.escape(change.entry) }"]`);

  // open the section; toggled via click as its state lives in the panel
  const groupHeader = getGroupHeader();

  if (groupHeader && !groupHeader.classList.contains('open') && !groupHeader.classList.contains('empty')) {
    groupHeader.click();

    await nextFrame();
  }

  // open collapsed list items containing the entry
  let node = getNode();

  let item = node && node.parentNode.closest('.bio-properties-panel-collapsible-entry:not(.open)');

  while (item && container.contains(item)) {
    item.querySelector(':scope > .bio-properties-panel-collapsible-entry-header').click();

    await nextFrame();

    node = getNode();
    item = node && node.parentNode.closest('.bio-properties-panel-collapsible-entry:not(.open)');
  }

  const target = node && node.offsetParent ? node : container.querySelector(groupSelector);

  if (target) {
    scrollToTarget(target, getGroupHeader());
  }
};

DiffDemoMarkers.prototype._scheduleDecorate = function() {
  if (this._scheduled) {
    return;
  }

  this._scheduled = requestAnimationFrame(() => {
    this._scheduled = null;
    this._decorateEntries();
  });
};

DiffDemoMarkers.prototype._decorateEntries = function() {
  const container = this._getContainer();

  if (!container) {
    return;
  }

  const changeByEntry = {};

  for (const change of this._getElementChanges()) {
    if (change.entry) {
      changeByEntry[ change.entry ] = change;
    }
  }

  if (resolveFromDom(container, this._getElementChanges())) {

    // groups and labels refined, update the summary
    this._eventBus.fire('diffDemo.elementChanges', {
      element: this._element,
      changes: this._getElementChanges()
    });
  }

  updateGroupCounts(container, this._getElementChanges());

  updateGhosts(container, this._getElementChanges().filter(change => change.ghost));

  // remove stale decorations, e.g. after selecting another element
  container.querySelectorAll(`[${ CHANGE_ATTR }]:not([${ GHOST_ATTR }])`).forEach(entryNode => {
    const entryId = entryNode.getAttribute('data-entry-id');

    const change = changeByEntry[ entryId ];

    if (!change || change.type !== entryNode.getAttribute(CHANGE_ATTR)) {
      undecorate(container, entryNode);
    }
  });

  for (const [ entryId, change ] of Object.entries(changeByEntry)) {
    const entryNode = container.querySelector(`[data-entry-id="${ CSS.escape(entryId) }"]`);

    if (!entryNode) {
      continue;
    }

    decorate(entryNode, change);

    if (change.type === 'changed' && typeof change.oldValue === 'string') {
      decorateInline(entryNode, change.oldValue, this._editing.has(entryId));
    }
  }
};

/**
 * Switch an inline diff entry to edit mode when clicking its diff or label.
 */
DiffDemoMarkers.prototype._handleClick = function(event) {
  const actionButton = event.target.closest('.diff-demo-action');

  if (actionButton) {
    event.preventDefault();
    event.stopPropagation();

    const ownerId = actionButton.getAttribute(OWNER_ATTR);

    if (actionButton.dataset.action === 'approve') {
      this._approve(ownerId);
    } else {
      this._restore(ownerId);
    }

    return;
  }

  const entryNode = event.target.closest(`[${ INLINE_ATTR }]`);

  if (!entryNode) {
    return;
  }

  const entryId = entryNode.getAttribute('data-entry-id');

  if (this._editing.has(entryId)) {
    return;
  }

  this._editing.add(entryId);

  const field = getFieldNode(entryNode);
  const view = getInlineView(entryNode);

  if (field) {
    field.removeAttribute(HIDDEN_ATTR);
  }

  if (view) {
    view.hidden = true;
  }

  const focusTarget = field && (field.querySelector('.cm-content') || field);

  if (focusTarget) {
    focusTarget.focus();
  }
};

/**
 * @param {string} ownerId - entry ID or ghost key
 */
DiffDemoMarkers.prototype._findChange = function(ownerId) {
  return this._getElementChanges().find(change => {
    return change.entry === ownerId || (change.ghost && getGhostKey(change) === ownerId);
  });
};

/**
 * Keep a change and stop marking it.
 *
 * @param {string} ownerId - entry ID or ghost key
 */
DiffDemoMarkers.prototype._approve = function(ownerId) {
  const change = this._findChange(ownerId);

  if (!change) {
    return;
  }

  this._editing.delete(ownerId);

  // recomputes changes, updating all markers
  this._injector.get('diffDemoChanges').approve(change, this._element);
};

/**
 * Revert a change and stop marking it.
 *
 * @param {string} ownerId - entry ID or ghost key
 */
DiffDemoMarkers.prototype._restore = function(ownerId) {
  const change = this._findChange(ownerId);

  if (!change || !change.restorable) {
    return;
  }

  this._editing.delete(ownerId);

  // recomputes changes, updating all markers
  this._injector.get('diffDemoChanges').restore(change, this._element);
};

/**
 * Show the inline diff again once focus leaves the entry.
 */
DiffDemoMarkers.prototype._handleFocusOut = function(event) {
  const entryNode = event.target.closest(`[${ INLINE_ATTR }]`);

  if (!entryNode || entryNode.contains(event.relatedTarget)) {
    return;
  }

  this._editing.delete(entryNode.getAttribute('data-entry-id'));

  this._scheduleDecorate();
};

function decorateInline(entryNode, oldValue, editing) {
  const entryId = entryNode.getAttribute('data-entry-id');

  const field = getFieldNode(entryNode);

  if (!field) {
    return;
  }

  entryNode.setAttribute(INLINE_ATTR, '');

  let view = getInlineView(entryNode);

  if (editing) {
    field.removeAttribute(HIDDEN_ATTR);

    if (view) {
      view.hidden = true;
    }

    return;
  }

  if (!view) {
    view = document.createElement('div');
    view.className = 'bio-properties-panel-input diff-demo-inline-view';
    view.setAttribute(OWNER_ATTR, entryId);

    field.parentNode.appendChild(view);
  }

  const feel = isFeel(field);

  view.classList.toggle('diff-demo-inline-view--feel', feel);

  // FEEL editors do not show the leading `=`
  if (feel) {
    oldValue = oldValue.replace(/^=/, '');
  }

  const newValue = getFieldValue(field);

  // re-render only if values changed, keeps the MutationObserver calm
  const key = JSON.stringify([ oldValue, newValue ]);

  if (view.dataset.diffKey !== key) {
    view.dataset.diffKey = key;
    view.replaceChildren(...renderDiff(oldValue, newValue));
  }

  view.hidden = false;
  field.setAttribute(HIDDEN_ATTR, '');
}

function getInlineView(entryNode) {
  const entryId = entryNode.getAttribute('data-entry-id');

  return entryNode.querySelector(`.diff-demo-inline-view[${ OWNER_ATTR }="${ CSS.escape(entryId) }"]`);
}

/**
 * Node to swap with the inline diff: the whole FEEL container (incl. `=`
 * indicator and popup button) or the plain input.
 */
function getFieldNode(entryNode) {
  return entryNode.querySelector('.bio-properties-panel-feel-container')
    || entryNode.querySelector('.bio-properties-panel-input:not(.diff-demo-inline-view)');
}

function isFeel(field) {
  return !!field.querySelector('.cm-editor');
}

function getFieldValue(field) {
  const lines = field.querySelectorAll('.cm-content .cm-line');

  if (lines.length) {
    return [ ...lines ].map(line => line.textContent).join('\n');
  }

  // plain input, possibly wrapped in a FEEL container with FEEL inactive
  const input = field.matches('input, textarea') ? field : field.querySelector('input, textarea');

  return (input && input.value) || '';
}

/**
 * @return {Array<Node>}
 */
function renderDiff(oldValue, newValue) {
  const parts = diffWordsWithSpace(oldValue, newValue);

  return parts.map((part, index) => {
    if (part.added || part.removed) {
      const node = document.createElement(part.added ? 'ins' : 'del');
      node.className = part.added ? 'diff-demo-ins' : 'diff-demo-del';
      node.textContent = part.value;

      return node;
    }

    return renderUnchanged(part.value, index === 0, index === parts.length - 1);
  });
}

/**
 * Render unchanged text, collapsing long runs to the context around changes.
 */
function renderUnchanged(text, isFirst, isLast) {
  const fragment = document.createDocumentFragment();

  const keepStart = isFirst ? 0 : CONTEXT_LENGTH;
  const keepEnd = isLast ? 0 : CONTEXT_LENGTH;

  const hidden = text.length - keepStart - keepEnd;

  // not worth collapsing
  if (hidden < 10) {
    fragment.append(text);

    return fragment;
  }

  const collapsed = document.createElement('span');
  collapsed.className = 'diff-demo-collapsed';
  collapsed.textContent = isFirst
    ? `(+${ hidden } unchanged chars) … `
    : ` … (+${ hidden } unchanged chars)${ isLast ? '' : ' … ' }`;

  fragment.append(text.slice(0, keepStart), collapsed, text.slice(text.length - keepEnd));

  return fragment;
}

function decorate(entryNode, change) {
  const { type, restorable } = change;

  const entryId = entryNode.getAttribute('data-entry-id');

  const labelNode = getLabelNode(entryNode);

  // decoration may have been dropped by a re-render
  const decorated = entryNode.getAttribute(CHANGE_ATTR) === type
    && labelNode
    && labelNode.querySelector(`[${ OWNER_ATTR }="${ CSS.escape(entryId) }"]`);

  if (decorated) {
    return;
  }

  entryNode.setAttribute(CHANGE_ATTR, type);

  if (!labelNode) {
    return;
  }

  labelNode.setAttribute(LABEL_ATTR, '');

  appendTagAndActions(labelNode, type, entryId, restorable);

  if (type === 'removed') {
    const input = entryNode.querySelector('input, textarea, [contenteditable]');

    if (input && !input.getAttribute('placeholder')) {
      input.setAttribute('placeholder', 'Empty');
      input.setAttribute(PLACEHOLDER_ATTR, '');
    }
  }
}

function nextFrame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

/**
 * Scroll the panel so the target sits right below its (sticky) group header.
 */
function scrollToTarget(target, groupHeader) {
  const scrollContainer = target.closest('.bio-properties-panel-scroll-container');

  if (!scrollContainer) {
    return target.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  const isGroup = target.matches('[data-group-id]');

  const offset = (!isGroup && groupHeader ? groupHeader.offsetHeight : 0) + 8;

  const top = target.getBoundingClientRect().top
    - scrollContainer.getBoundingClientRect().top
    + scrollContainer.scrollTop
    - offset;

  scrollContainer.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function appendTagAndActions(labelNode, type, ownerId, restorable) {
  const tag = document.createElement('span');
  tag.className = `diff-demo-tag diff-demo-tag--${ type }`;
  tag.setAttribute(OWNER_ATTR, ownerId);
  tag.textContent = LABELS[ type ];

  labelNode.appendChild(tag);

  const actions = document.createElement('span');
  actions.className = 'diff-demo-actions';
  actions.setAttribute(OWNER_ATTR, ownerId);

  actions.appendChild(createAction('approve', 'Approve change', APPROVE_ICON, ownerId));

  if (restorable) {
    actions.appendChild(createAction('revert', 'Revert change', REVERT_ICON, ownerId));
  }

  labelNode.appendChild(actions);
}

function createAction(action, title, icon, ownerId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `diff-demo-action diff-demo-action--${ action }`;
  button.dataset.action = action;
  button.title = title;
  button.setAttribute('aria-label', title);
  button.setAttribute(OWNER_ATTR, ownerId);
  button.innerHTML = icon;

  return button;
}

/**
 * Sync placeholder items for removed list items, appended to their group.
 */
function updateGhosts(container, ghosts) {
  const keys = ghosts.map(getGhostKey);

  container.querySelectorAll(`[${ GHOST_ATTR }]`).forEach(node => {
    if (!keys.includes(node.getAttribute(GHOST_ATTR))) {
      node.remove();
    }
  });

  for (const ghost of ghosts) {
    const key = getGhostKey(ghost);

    const groupNode = container.querySelector(`[data-group-id="group-${ CSS.escape(ghost.group) }"]`);

    if (!groupNode || groupNode.querySelector(`[${ GHOST_ATTR }="${ CSS.escape(key) }"]`)) {
      continue;
    }

    groupNode.appendChild(createGhost(ghost, key));
  }
}

/**
 * Refine groups and labels of changes from the rendered properties panel,
 * once per change.
 *
 * @return {boolean} whether anything was refined
 */
function resolveFromDom(container, changes) {
  let refined = false;

  for (const change of changes) {
    if (change.resolvedFromDom) {
      continue;
    }

    const entryNode = change.entry && container.querySelector(`[data-entry-id="${ CSS.escape(change.entry) }"]`);

    const groupNode = entryNode
      ? entryNode.closest('[data-group-id]')
      : change.group && container.querySelector(`[data-group-id="group-${ CSS.escape(change.group) }"]`);

    if (!groupNode) {
      continue;
    }

    change.resolvedFromDom = true;
    refined = true;

    change.group = groupNode.getAttribute('data-group-id').replace(/^group-/, '');

    const groupTitle = groupNode.querySelector(':scope > .bio-properties-panel-group-header > .bio-properties-panel-group-header-title');

    change.groupLabel = getOwnText(groupTitle) || change.groupLabel;

    // list items keep their computed label, e.g. `Output: preparedAt`
    if (entryNode && !entryNode.classList.contains('bio-properties-panel-collapsible-entry')) {
      const label = getOwnText(entryNode.querySelector('.bio-properties-panel-label'));

      if (label) {
        change.label = change.labelPrefix + label;
      }
    }
  }

  return refined;
}

/**
 * Text of a label, ignoring injected decorations (appended after it).
 */
function getOwnText(node) {
  const text = node && node.firstChild && node.firstChild.textContent;

  return text ? text.trim() : null;
}

function getGhostKey({ group, ghost }) {
  return `${ group }:${ ghost }`;
}

function createGhost({ ghost, type, restorable }, key) {
  const node = document.createElement('div');
  node.className = 'bio-properties-panel-collapsible-entry diff-demo-ghost';
  node.setAttribute(GHOST_ATTR, key);
  node.setAttribute(CHANGE_ATTR, type);

  const header = document.createElement('div');
  header.className = 'bio-properties-panel-collapsible-entry-header';

  const title = document.createElement('div');
  title.className = 'bio-properties-panel-collapsible-entry-header-title';
  title.setAttribute(LABEL_ATTR, '');

  const label = document.createElement('span');
  label.className = 'diff-demo-ghost-label';
  label.textContent = ghost;

  title.appendChild(label);

  appendTagAndActions(title, type, key, restorable);

  header.appendChild(title);
  node.appendChild(header);

  return node;
}

function undecorate(container, entryNode) {
  const entryId = entryNode.getAttribute('data-entry-id');

  entryNode.removeAttribute(CHANGE_ATTR);
  entryNode.removeAttribute(INLINE_ATTR);

  entryNode.querySelectorAll(`[${ HIDDEN_ATTR }]`).forEach(node => node.removeAttribute(HIDDEN_ATTR));

  container.querySelectorAll(`[${ OWNER_ATTR }="${ CSS.escape(entryId) }"]`).forEach(node => node.remove());

  const labelNode = getLabelNode(entryNode);

  if (labelNode) {
    labelNode.removeAttribute(LABEL_ATTR);
  }

  entryNode.querySelectorAll(`[${ PLACEHOLDER_ATTR }]`).forEach(input => {
    input.removeAttribute('placeholder');
    input.removeAttribute(PLACEHOLDER_ATTR);
  });
}

/**
 * Label of a regular entry or header title of a list item.
 */
function getLabelNode(entryNode) {
  if (entryNode.classList.contains('bio-properties-panel-collapsible-entry')) {
    return entryNode.querySelector(':scope > .bio-properties-panel-collapsible-entry-header > .bio-properties-panel-collapsible-entry-header-title');
  }

  return entryNode.querySelector('.bio-properties-panel-label');
}

/**
 * Sync color coded change counts, appended to group header titles.
 */
function updateGroupCounts(container, changes) {
  const countsByGroup = {};

  for (const { group, type } of changes) {
    countsByGroup[ group ] = countsByGroup[ group ] || {};
    countsByGroup[ group ][ type ] = (countsByGroup[ group ][ type ] || 0) + 1;
  }

  container.querySelectorAll('[data-group-id]').forEach(groupNode => {
    const groupId = groupNode.getAttribute('data-group-id').replace(/^group-/, '');

    const title = groupNode.querySelector(':scope > .bio-properties-panel-group-header > .bio-properties-panel-group-header-title');

    if (!title) {
      return;
    }

    const counts = countsByGroup[ groupId ];

    const key = counts ? TYPES.filter(type => counts[ type ]).map(type => `${ type }:${ counts[ type ] }`).join(',') : '';

    const existing = title.querySelector(`[${ GROUP_COUNTS_ATTR }]`);

    if (existing && existing.getAttribute(GROUP_COUNTS_ATTR) === key) {
      return;
    }

    if (existing) {
      existing.remove();
    }

    if (!key) {
      return;
    }

    const node = document.createElement('span');
    node.className = 'diff-demo-group-counts';
    node.setAttribute(GROUP_COUNTS_ATTR, key);

    for (const type of TYPES) {
      if (!counts[ type ]) {
        continue;
      }

      const count = document.createElement('span');
      count.className = `diff-demo-count diff-demo-count--${ type }`;
      count.title = `${ counts[ type ] } ${ LABELS[ type ].toLowerCase() }`;
      count.textContent = counts[ type ];

      node.appendChild(count);
    }

    title.appendChild(node);
  });
}
