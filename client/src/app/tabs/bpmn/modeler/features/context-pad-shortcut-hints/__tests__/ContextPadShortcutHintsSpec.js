/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import PaletteTooltipComponent from 'diagram-js/lib/features/palette/PaletteTooltipComponent';

import ContextPadShortcutHints from '../ContextPadShortcutHints';

import {
  APPEND_ELEMENT_SHORTCUT,
  REPLACE_ELEMENT_SHORTCUT
} from '../../../../../../KeyboardBindings';

import { getSelectionEntries } from '../../../../../getEditMenu';


describe('ContextPadShortcutHints', function() {

  let container;
  let eventHandlers;
  let hoverTooltip;
  let tooltipConfig;

  beforeEach(function() {
    container = document.createElement('div');
    eventHandlers = {};
    hoverTooltip = {
      add: sinon.spy()
    };

    const eventBus = {
      on: (event, handler) => {
        eventHandlers[ event ] = handler;
      }
    };

    const canvas = {
      getContainer: () => container
    };

    new ContextPadShortcutHints(eventBus, canvas, hoverTooltip);

    tooltipConfig = hoverTooltip.add.firstCall.args[ 0 ];
  });

  afterEach(function() {
    container.remove();
  });


  it('should show shortcut hints for append and replace actions', function() {

    // given
    const replaceEntry = createEntry({
      'data-action': 'replace',
      title: 'Change element'
    });
    const appendEntry = createEntry({
      'data-action': 'append',
      title: 'Append element'
    });

    // when
    const replaceTooltip = tooltipConfig.getContent(replaceEntry);
    const appendTooltip = tooltipConfig.getContent(appendEntry);

    // then
    expect(replaceTooltip.type).to.equal(PaletteTooltipComponent);
    expect(replaceTooltip.props).to.include({
      title: 'Change element',
      shortcut: REPLACE_ELEMENT_SHORTCUT
    });
    expect(appendTooltip.type).to.equal(PaletteTooltipComponent);
    expect(appendTooltip.props).to.include({
      title: 'Append element',
      shortcut: APPEND_ELEMENT_SHORTCUT
    });
  });


  it('should show the append shortcut on the append indicator', function() {

    // given
    const appendIndicator = createEntry({
      title: 'Append element'
    });

    appendIndicator.classList.add('djs-append-indicator');

    // when
    const appendTooltip = tooltipConfig.getContent(appendIndicator);

    // then
    expect(appendTooltip.props).to.include({
      title: 'Append element',
      shortcut: APPEND_ELEMENT_SHORTCUT
    });
    expect(appendIndicator.getAttribute('aria-label')).to.equal('Append element');
    expect(appendIndicator.getAttribute('aria-keyshortcuts')).to.equal(APPEND_ELEMENT_SHORTCUT);
    expect(appendIndicator.hasAttribute('title')).to.equal(false);
  });


  it('should use the shortcuts registered in the edit menu', function() {

    // given
    const entries = getSelectionEntries({
      appendElement: true,
      replaceElement: true
    });

    const append = entries.find(({ action }) => action === 'appendElement');
    const replace = entries.find(({ action }) => action === 'replaceElement');

    // then
    expect(append.accelerator).to.equal(APPEND_ELEMENT_SHORTCUT);
    expect(replace.accelerator).to.equal(REPLACE_ELEMENT_SHORTCUT);
  });


  it('should not show a shortcut hint for actions without shortcuts', function() {

    // given
    const deleteEntry = createEntry({
      'data-action': 'delete',
      title: 'Delete'
    });
    const appendTaskEntry = createEntry({
      'data-entry-id': 'append.append-task',
      'aria-label': 'Append task'
    });

    // when
    const deleteTooltip = tooltipConfig.getContent(deleteEntry);
    const appendTaskTooltip = tooltipConfig.getContent(appendTaskEntry);

    // then
    expect(deleteTooltip).to.equal(null);
    expect(appendTaskTooltip).to.equal(null);
  });


  it('should preserve context-pad actions and accessible labels', function() {

    // given
    const replaceAction = sinon.spy();
    const appendAction = sinon.spy();
    const deleteAction = sinon.spy();
    const replaceEntry = createEntry({
      'data-action': 'replace',
      title: 'Change element'
    });
    const deleteEntry = createEntry({
      'data-action': 'delete',
      title: 'Delete'
    });
    const appendEntry = createEntry({
      'data-action': 'append',
      title: 'Append element'
    });
    const html = document.createElement('div');
    html.append(replaceEntry, appendEntry, deleteEntry);

    const entries = {
      replace: {
        title: 'Change element',
        action: { click: replaceAction }
      },
      append: {
        title: 'Append element',
        action: { click: appendAction }
      },
      delete: {
        title: 'Delete',
        action: { click: deleteAction }
      }
    };

    // when
    eventHandlers['contextPad.open']({
      current: { entries, html }
    });
    entries.replace.action.click();
    entries.append.action.click();
    entries.delete.action.click();

    // then
    expect(replaceEntry.getAttribute('aria-label')).to.equal('Change element');
    expect(replaceEntry.getAttribute('aria-keyshortcuts')).to.equal(REPLACE_ELEMENT_SHORTCUT);
    expect(replaceEntry.hasAttribute('title')).to.equal(false);
    expect(appendEntry.getAttribute('aria-label')).to.equal('Append element');
    expect(appendEntry.getAttribute('aria-keyshortcuts')).to.equal(APPEND_ELEMENT_SHORTCUT);
    expect(appendEntry.hasAttribute('title')).to.equal(false);
    expect(deleteEntry.getAttribute('title')).to.equal('Delete');
    expect(replaceAction).to.have.been.calledOnce;
    expect(appendAction).to.have.been.calledOnce;
    expect(deleteAction).to.have.been.calledOnce;
  });


  it('should add the append shortcut to the append pad trigger', function() {

    // given
    const pad = document.createElement('div');
    const tooltipWrapper = document.createElement('div');
    const appendEntry = createEntry({
      'data-entry-id': 'append',
      'aria-label': 'Append element'
    });

    tooltipWrapper.classList.add('djs-create-pad-tooltip');
    appendEntry.classList.add('djs-create-pad-entry');
    tooltipWrapper.appendChild(appendEntry);
    pad.appendChild(tooltipWrapper);

    // when
    eventHandlers['createPad.open']({ current: { html: pad } });
    const tooltip = tooltipConfig.getContent(appendEntry);

    // then
    expect(appendEntry.getAttribute('aria-keyshortcuts')).to.equal(APPEND_ELEMENT_SHORTCUT);
    expect(tooltipWrapper.classList.contains('djs-create-pad-tooltip--shortcut')).to.equal(true);
    expect(tooltip.props).to.include({
      title: 'Append element',
      shortcut: APPEND_ELEMENT_SHORTCUT
    });
  });

});

function createEntry(attributes) {
  const entry = document.createElement('div');

  Object.entries(attributes).forEach(([ name, value ]) => {
    entry.setAttribute(name, value);
  });

  return entry;
}
