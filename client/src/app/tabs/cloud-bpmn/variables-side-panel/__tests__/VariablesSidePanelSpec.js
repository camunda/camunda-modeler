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

import React from 'react';

import { render, fireEvent, screen } from '@testing-library/react';

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

});


// helpers //////////

function createMockInjector() {
  const services = {
    bpmnjs: {
      getDefinitions: () => null
    },
    variableResolver: {},
    eventBus: {
      on: noop,
      off: noop,
      fire: noop
    },
    selection: {
      get: () => []
    }
  };

  return {
    get: (name) => services[name] || {}
  };
}


function createVariablesSidePanel(options = {}) {
  const {
    layout = {
      variablesSidePanel: { open: true, width: 280 }
    },
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
