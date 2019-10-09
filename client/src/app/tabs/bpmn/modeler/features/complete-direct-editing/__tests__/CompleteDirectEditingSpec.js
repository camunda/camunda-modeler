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

import CompleteDirectEditing from '../CompleteDirectEditing';

const spy = sinon.spy;


describe('CompleteDirectEditing', function() {

  it('should complete direct editing', function() {

    // given
    const completeDirectEditingSpy = spy();

    const modeler = createModeler(createDependencies(false, true, completeDirectEditingSpy));

    // when
    modeler.get('editorActions').execute('saveTab.start');

    // then
    expect(completeDirectEditingSpy).to.have.been.called;
  });


  describe('should NOT complete direct editing', function() {

    it('if no direct editing', function() {

      // given
      const completeDirectEditingSpy = spy();

      const modeler = createModeler(createDependencies(true, false, completeDirectEditingSpy));

      // when
      modeler.get('editorActions').execute('saveTab.start');

      // then
      expect(completeDirectEditingSpy).to.not.have.been.called;
    });


    it('if direct editing not active', function() {

      // given
      const completeDirectEditingSpy = spy();

      const modeler = createModeler(createDependencies(false, false, completeDirectEditingSpy));

      // when
      modeler.get('editorActions').execute('saveTab.start');

      // then
      expect(completeDirectEditingSpy).to.not.have.been.called;
    });

  });

});


// helpers //////////

function createDependencies(hasDirectEditing, isDirectEditingActive, completeDirectEditingSpy) {
  return {
    editorActions: {
      _actions: {},
      execute(action) {
        this._actions[ action ]();
      },
      register(action, listener) {
        this._actions[ action ] = listener;
      }
    },
    injector: {
      get: () => {
        return hasDirectEditing ? null : {
          isActive() {
            return isDirectEditingActive;
          },
          complete: completeDirectEditingSpy
        };
      }
    }
  };
}

function createModeler(dependencies) {
  return new Modeler({
    modules: {
      ...dependencies,
      completeDirectEditing: new CompleteDirectEditing(
        ...CompleteDirectEditing.$inject.map(name => dependencies[ name ] || {})
      )
    }
  });
}
