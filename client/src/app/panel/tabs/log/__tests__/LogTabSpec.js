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

import { mount } from 'enzyme';

import { SlotFillRoot } from '../../../../slot-fill';

import Panel from '../../../Panel';

import LogTab from '../LogTab';

const spy = sinon.spy;


describe('<LogTab>', function() {

  it('should render', function() {

    // when
    const wrapper = renderLogTab();

    // then
    expect(wrapper.find('.panel__link')).to.have.length(1);
    expect(wrapper.find('.panel__link--active')).to.have.length(1);

    expect(wrapper.find('.panel__link').at(0).find('.panel__link-label').text()).to.equal('Output');
    expect(wrapper.find('.panel__link').at(0).hasClass('panel__link--active')).to.be.true;

    expect(wrapper.find('.entry')).to.have.length(1);
    expect(wrapper.find('.entry').text()).to.equal('Foo message [ error ]');
  });


  it('should render entry actions', function() {

    // given
    const onActionSpy = spy();

    // when
    const wrapper = renderLogTab({
      logEntries: [
        {
          category: 'error',
          message: 'Foo message',
          action: onActionSpy
        }
      ]
    });

    // then
    expect(wrapper.find('.action')).to.have.length(1);

    wrapper.find('.action').first().simulate('click');

    expect(onActionSpy).to.have.been.called;
  });


  it('should render tab actions', function() {

    // when
    const wrapper = renderLogTab();

    // then
    expect(wrapper.find('.panel__action')).to.have.length(3);

    expect(wrapper.find('.panel__action[title="Copy output"]')).to.have.length(1);
    expect(wrapper.find('.panel__action[title="Clear output"]')).to.have.length(1);
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

  return mount(
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
