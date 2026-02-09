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

import { render, fireEvent } from '@testing-library/react';

import { SlotFillRoot } from '../../../../slot-fill';

import Panel from '../../../Panel';

import LogTab from '../LogTab';

const spy = sinon.spy;


describe('<LogTab>', function() {

  it('should render', function() {

    // when
    const { container } = renderLogTab();

    // then
    expect(container.querySelectorAll('.panel__link')).to.have.length(1);
    expect(container.querySelectorAll('.panel__link--active')).to.have.length(1);

    const panelLink = container.querySelector('.panel__link');
    expect(panelLink.querySelector('.panel__link-label').textContent).to.equal('Output');
    expect(panelLink.classList.contains('panel__link--active')).to.be.true;

    expect(container.querySelectorAll('.entry')).to.have.length(1);
    expect(container.querySelector('.entry').textContent).to.equal('Foo message [ error ]');
  });


  it('should render entry actions', function() {

    // given
    const onActionSpy = spy();

    // when
    const { container } = renderLogTab({
      logEntries: [
        {
          category: 'error',
          message: 'Foo message',
          action: onActionSpy
        }
      ]
    });

    // then
    expect(container.querySelectorAll('.action')).to.have.length(1);

    fireEvent.click(container.querySelector('.action'));

    expect(onActionSpy).to.have.been.called;
  });


  it('should render tab actions', function() {

    // when
    const { container } = renderLogTab();

    // then
    expect(container.querySelectorAll('.panel__action')).to.have.length(3);

    expect(container.querySelector('.panel__action[title="Copy output"]')).to.exist;
    expect(container.querySelector('.panel__action[title="Clear output"]')).to.exist;
  });

});


// helpers //////////

const defaultLayout = {
  panel: {
    open: true,
    tab: 'log'
  }
};

const defaultLogEntries = [
  {
    category: 'error',
    message: 'Foo message',
    action: () => {}
  }
];

function renderLogTab(options = {}) {
  const {
    layout = defaultLayout,
    logEntries = defaultLogEntries,
    clearLog = () => {},
    onAction = () => {},
    onLayoutChanged = () => {}
  } = options;

  return render(
    <SlotFillRoot>
      <Panel
        layout={ layout }>
        <LogTab
          layout={ layout }
          entries={ logEntries }
          onClear={ clearLog }
          onAction={ onAction }
          onLayoutChanged={ onLayoutChanged } />
      </Panel>
    </SlotFillRoot>
  );
}
