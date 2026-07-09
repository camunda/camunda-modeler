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

import Modeler from 'test/mocks/bpmn-js/Modeler';

import PropertiesPanelKeyboardBindings from '../PropertiesPanelKeyboardBindings';

import {
  assign,
  isString
} from 'min-dash';

const spy = sinon.spy;


describe('PropertiesPanelKeyboardBindings', function() {

  let container;

  beforeEach(function() {
    container = document.createElement('div');
  });

  afterEach(function() {
    container.remove();
  });


  it('should undo', function() {

    // given
    const undoSpy = spy();

    const modeler = createModeler({
      commandStack: {
        canUndo: () => true,
        undo: undoSpy
      },
      eventBus: {
        on: (_, callback) => callback()
      },
      propertiesPanel: {
        _container: container
      }
    });

    const propertiesPanelKeyboardBindings = modeler.get('propertiesPanelKeyboardBindings');

    const event = createKeyEvent('Z', { ctrlKey: true });

    // when
    propertiesPanelKeyboardBindings.handleKeydown(event);

    // then
    expect(undoSpy).to.have.been.called;
  });


  it('should redo', function() {

    // given
    const redoSpy = spy();

    const modeler = createModeler({
      commandStack: {
        canRedo: () => true,
        redo: redoSpy
      },
      eventBus: {
        on: (_, callback) => callback()
      },
      propertiesPanel: {
        _container: container
      }
    });

    const propertiesPanelKeyboardBindings = modeler.get('propertiesPanelKeyboardBindings');

    const event = createKeyEvent('Y', { ctrlKey: true });

    // when
    propertiesPanelKeyboardBindings.handleKeydown(event);

    // then
    expect(redoSpy).to.have.been.called;
  });


  it('should restore canvas focus when focused element is removed on command', async function() {

    // given
    const restoreFocusSpy = spy();

    const input = document.createElement('input');

    container.appendChild(input);

    document.body.appendChild(container);

    const modeler = createModeler({
      canvas: {
        restoreFocus: restoreFocusSpy
      },
      eventBus: {
        on: (_, callback) => callback()
      },
      propertiesPanel: {
        _container: container
      }
    });

    const propertiesPanelKeyboardBindings = modeler.get('propertiesPanelKeyboardBindings');

    input.focus();

    // when
    propertiesPanelKeyboardBindings.restoreCanvasFocus();

    input.remove();

    await nextTick();

    // then
    expect(restoreFocusSpy).to.have.been.called;
  });


  it('should not restore canvas focus when properties panel is not focused', async function() {

    // given
    const restoreFocusSpy = spy();

    document.body.appendChild(container);

    const modeler = createModeler({
      canvas: {
        restoreFocus: restoreFocusSpy
      },
      eventBus: {
        on: (_, callback) => callback()
      },
      propertiesPanel: {
        _container: container
      }
    });

    const propertiesPanelKeyboardBindings = modeler.get('propertiesPanelKeyboardBindings');

    // when
    propertiesPanelKeyboardBindings.restoreCanvasFocus();

    await nextTick();

    // then
    expect(restoreFocusSpy).not.to.have.been.called;
  });


  it('should handle focusin', function() {

    // given
    const fireSpy = spy();

    const modeler = createModeler({
      eventBus: {
        fire: fireSpy,
        on: (_, callback) => callback()
      },
      propertiesPanel: {
        _container: container
      }
    });

    const propertiesPanelKeyboardBindings = modeler.get('propertiesPanelKeyboardBindings');

    // when
    propertiesPanelKeyboardBindings.handleFocusin();

    // then
    expect(fireSpy).to.have.been.called;
  });


  it('should handle focusout', function() {

    // given
    const fireSpy = spy();

    const modeler = createModeler({
      eventBus: {
        fire: fireSpy,
        on: (_, callback) => callback()
      },
      propertiesPanel: {
        _container: container
      }
    });

    const propertiesPanelKeyboardBindings = modeler.get('propertiesPanelKeyboardBindings');

    // when
    propertiesPanelKeyboardBindings.handleFocusout();

    // then
    expect(fireSpy).to.have.been.called;
  });

});

// helpers //////

/**
 * Create and return a modeler instance with a module that was instanciated with
 * dependencies.
 *
 * @param {Object} Module - Module constructor.
 * @param {Object} dependencies - Dependencies.
 *
 * @returns {Object}
 */
function createModeler(dependencies) {
  return new Modeler({
    modules: {
      ...dependencies,
      propertiesPanelKeyboardBindings: new PropertiesPanelKeyboardBindings(
        ...PropertiesPanelKeyboardBindings.$inject.map(name => dependencies[ name ] || {})
      )
    }
  });
}

function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Create a fake key event for testing purposes.
 *
 * @param {string|number} key the key or keyCode/charCode
 * @param {Object} [attrs]
 *
 * @return {Event}
 */
function createKeyEvent(key, attrs) {
  var event = document.createEvent('Events') || new document.defaultView.CustomEvent('keyEvent');

  // init and mark as bubbles / cancelable
  event.initEvent('keydown', false, true);

  var keyAttrs = isString(key) ? { key: key } : { keyCode: key, which: key };

  return assign(event, keyAttrs, attrs || {});
}
