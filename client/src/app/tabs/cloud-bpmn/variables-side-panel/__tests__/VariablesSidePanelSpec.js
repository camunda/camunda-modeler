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

import React from 'react';

import { act, render, fireEvent, screen } from '@testing-library/react';

import EventBus from 'diagram-js/lib/core/EventBus';

import VariablesSidePanel from '../VariablesSidePanel';

const { spy } = sinon;

const noop = () => {};


describe('<VariablesSidePanel>', function() {

  it('should render title bar', function() {

    // when
    createVariablesSidePanel();

    // then
    expect(screen.getByText('Variables')).to.exist;
    expect(screen.getByRole('button', { name: 'Close panel' })).to.exist;
  });


  it('should close on title bar close button click', function() {

    // given
    const onLayoutChanged = spy();

    createVariablesSidePanel({ onLayoutChanged });

    // when
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }));

    // then
    expect(onLayoutChanged).to.have.been.calledOnce;

    const layoutArg = onLayoutChanged.firstCall.args[0];

    expect(layoutArg.variablesSidePanel.open).to.be.false;
  });


  describe('variable resolver', function() {

    let eventBus, injector, variableResolver;

    beforeEach(function() {
      eventBus = new EventBus();

      injector = createMockInjector({ eventBus });

      variableResolver = injector.get('variableResolver');
    });


    it('should query variables when open', async function() {

      // when
      await act(async () => {
        createVariablesSidePanel({ injector, layout: createLayout(true) });
      });

      // then
      expect(variableResolver.getVariables).to.have.been.called;
    });


    it('should query variables on change when open', async function() {

      // given
      await act(async () => {
        createVariablesSidePanel({ injector, layout: createLayout(true) });
      });

      variableResolver.getVariables.resetHistory();

      // when
      await act(async () => {
        eventBus.fire('commandStack.changed');
      });

      // then
      expect(variableResolver.getVariables).to.have.been.called;
    });


    it('should NOT query variables when closed', async function() {

      // given
      await act(async () => {
        createVariablesSidePanel({ injector, layout: createLayout(false) });
      });

      // when
      await act(async () => {
        eventBus.fire('commandStack.changed');
      });

      // then
      expect(variableResolver.getVariables).not.to.have.been.called;
    });


    it('should query variables on open', async function() {

      // given
      const { rerender } = createVariablesSidePanel({ injector, layout: createLayout(false) });

      // when
      await act(async () => {
        rerender(
          <VariablesSidePanel
            injector={ injector }
            layout={ createLayout(true) }
            onLayoutChanged={ noop }
          />
        );
      });

      // then
      expect(variableResolver.getVariables).to.have.been.called;
    });


    it('should NOT query variables on change after close', async function() {

      // given
      const { rerender } = createVariablesSidePanel({ injector, layout: createLayout(true) });

      await act(async () => {
        rerender(
          <VariablesSidePanel
            injector={ injector }
            layout={ createLayout(false) }
            onLayoutChanged={ noop }
          />
        );
      });

      variableResolver.getVariables.resetHistory();

      // when
      await act(async () => {
        eventBus.fire('commandStack.changed');
      });

      // then
      expect(variableResolver.getVariables).not.to.have.been.called;
    });

  });

});


// helpers //////////

function createMockInjector(options = {}) {
  const {
    eventBus = {
      on: noop,
      off: noop,
      fire: noop
    }
  } = options;

  const services = {
    bpmnjs: {
      getDefinitions: () => ({})
    },
    variableResolver: {
      getVariables: spy(() => Promise.resolve({}))
    },
    eventBus,
    selection: {
      get: () => []
    }
  };

  return {
    get: (name) => services[name] || {}
  };
}


function createLayout(open) {
  return {
    variablesSidePanel: { open, width: 280 }
  };
}


function createVariablesSidePanel(options = {}) {
  const {
    layout = createLayout(true),
    onLayoutChanged = noop,
    injector = createMockInjector()
  } = options;

  return render(
    <VariablesSidePanel
      injector={ injector }
      layout={ layout }
      onLayoutChanged={ onLayoutChanged }
    />
  );
}
