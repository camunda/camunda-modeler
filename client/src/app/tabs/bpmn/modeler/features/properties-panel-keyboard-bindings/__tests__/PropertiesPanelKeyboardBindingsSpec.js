/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import Modeler from 'test/mocks/bpmn-js/Modeler';

import PropertiesPanelKeyboardBindings from '../PropertiesPanelKeyoardBindings';

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