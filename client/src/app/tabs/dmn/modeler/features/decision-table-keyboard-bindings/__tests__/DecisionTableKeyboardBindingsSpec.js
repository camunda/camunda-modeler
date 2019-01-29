/* global sinon */

import Modeler from 'test/mocks/dmn-js/Modeler';

import {
  assign,
  isString
} from 'min-dash';

import DecisionTableKeyboardBindings from '../DecisionTableKeyboardBindings';

const spy = sinon.spy;

describe('DecisionTableKeyboardBindings', function() {

  let container;

  beforeEach(function() {
    container = document.createElement('div');
  });

  afterEach(function() {
    sinon.restore();
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
      decisionTable: {
        _container: container
      }
    });

    const activeViewer = modeler.getActiveViewer();

    const decisionTableKeyboardBindings = activeViewer.get('decisionTable').decisionTableKeyboardBindings;

    const event = createKeyEvent('Z', { ctrlKey: true });

    // when
    decisionTableKeyboardBindings.handleKeydown(event);

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
      decisionTable: {
        _container: container
      }
    });

    const activeViewer = modeler.getActiveViewer();

    const decisionTableKeyboardBindings = activeViewer.get('decisionTable').decisionTableKeyboardBindings;

    const event = createKeyEvent('Y', { ctrlKey: true });

    // when
    decisionTableKeyboardBindings.handleKeydown(event);

    // then
    expect(redoSpy).to.have.been.called;
  });


  it('should handle selectCellBelow', function() {

    // given
    const triggerSpy = spy();

    const modeler = createModeler({
      editorActions: {
        trigger: triggerSpy,
      },
      eventBus: {
        on: (_, callback) => callback()
      },
      decisionTable: {
        _container: container
      }
    });

    const activeViewer = modeler.getActiveViewer();

    const decisionTableKeyboardBindings = activeViewer.get('decisionTable').decisionTableKeyboardBindings;

    const selectableAncestorSpy =
      sinon.stub(decisionTableKeyboardBindings, '_hasSelectableAncestor').returns(true);

    const event = createKeyEvent('Enter', { ctrlKey: false });

    // when
    decisionTableKeyboardBindings.handleKeydown(event);

    // then
    expect(selectableAncestorSpy).to.have.been.called;
    expect(triggerSpy).to.have.been.calledWith('selectCellBelow');

  });


  it('should handle selectCellAbove', function() {

    // given
    const triggerSpy = spy();

    const modeler = createModeler({
      editorActions: {
        trigger: triggerSpy,
      },
      eventBus: {
        on: (_, callback) => callback()
      },
      decisionTable: {
        _container: container
      }
    });

    const activeViewer = modeler.getActiveViewer();

    const decisionTableKeyboardBindings = activeViewer.get('decisionTable').decisionTableKeyboardBindings;

    const selectableAncestorSpy =
      sinon.stub(decisionTableKeyboardBindings, '_hasSelectableAncestor').returns(true);

    const event = createKeyEvent('Enter', {
      ctrlKey: false,
      shiftKey: true
    });

    // when
    decisionTableKeyboardBindings.handleKeydown(event);

    // then
    expect(selectableAncestorSpy).to.have.been.called;
    expect(triggerSpy).to.have.been.calledWith('selectCellAbove');

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
    ...dependencies,
    decisionTable: {
      ...dependencies.decisionTable,
      decisionTableKeyboardBindings: new DecisionTableKeyboardBindings(
        ...DecisionTableKeyboardBindings.$inject.map(name => dependencies[ name ] || {})
      )
    }
  });
}

/**
 * Create a fake key event for testing purposes.
 *
 * @param {String|Number} key the key or keyCode/charCode
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