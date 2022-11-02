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

import Panel from '../../Panel';

import LintingTab from '../LintingTab';

const spy = sinon.spy;


describe('<LintingTab>', function() {

  it('should render', function() {

    // when
    const wrapper = renderLintingTab();

    // then
    expect(wrapper.find('.panel__link')).to.have.length(1);
    expect(wrapper.find('.panel__link--active')).to.have.length(1);

    expect(wrapper.find('.panel__link').at(0).find('.panel__link-label').text()).to.equal('Problems');
    expect(wrapper.find('.panel__link').at(0).hasClass('panel__link--active')).to.be.true;

    expect(wrapper.find('.panel__link-number')).to.have.length(1);
    expect(wrapper.find('.panel__link-number').text()).to.equal('1');

    expect(wrapper.find('.linting-issue__content')).to.have.length(1);
    expect(wrapper.find('.linting-issue__content').text()).to.equal('Foo message');
  });


  it('should render (no problems)', function() {

    // when
    const wrapper = renderLintingTab({
      linting: []
    });

    // then
    expect(wrapper.find('.panel__link')).to.have.length(1);
    expect(wrapper.find('.panel__link--active')).to.have.length(1);

    expect(wrapper.find('.panel__link').at(0).find('.panel__link-label').text()).to.equal('Problems');
    expect(wrapper.find('.panel__link').at(0).hasClass('panel__link--active')).to.be.true;

    expect(wrapper.find('.panel__link-number')).to.have.length(1);
    expect(wrapper.find('.panel__link-number').text()).to.equal('0');

    expect(wrapper.find('.linting-issue--empty')).to.have.length(1);
    expect(wrapper.find('.linting-issue--empty').text()).to.equal('No problems found.');
  });


  it('should sort', function() {

    // when
    const wrapper = renderLintingTab({
      linting: [
        {
          category: 'error',
          id: 'foo',
          name: 'Foo',
          message: 'foo error'
        },
        {
          category: 'error',
          id: 'bar',
          name: 'Bar 1',
          message: 'bar 1 error'
        },
        {
          category: 'error',
          id: 'bar',
          name: 'Bar 2',
          message: 'bar 2 error'
        },
        {
          category: 'warn',
          id: 'baz',
          message: 'baz 1 warning'
        },
        {
          category: 'error',
          id: 'baz',
          message: 'baz 2 error'
        }
      ]
    });

    // then
    expect(wrapper.find('.linting-issue__content')).to.have.length(5);
    expect(wrapper.find('.linting-issue__content').at(0).text()).to.equal('bar 1 error');
    expect(wrapper.find('.linting-issue__content').at(1).text()).to.equal('bar 2 error');
    expect(wrapper.find('.linting-issue__content').at(2).text()).to.equal('baz 1 warning');
    expect(wrapper.find('.linting-issue__content').at(3).text()).to.equal('baz 2 error');
    expect(wrapper.find('.linting-issue__content').at(4).text()).to.equal('foo error');
  });


  it('should show lint error on click', function() {

    // when
    const onActionSpy = spy();

    const wrapper = renderLintingTab({
      onAction: onActionSpy
    });

    // then
    wrapper.find('.linting-issue').at(0).simulate('click');

    // then
    expect(onActionSpy).to.have.been.calledOnce;
    expect(onActionSpy).to.have.been.calledWithMatch('showLintError', {
      id: 'foo',
      name: 'Foo',
      message: 'Foo message'
    });
  });

});


// helpers //////////

const defaultLayout = {
  panel: {
    open: true,
    tab: 'linting'
  }
};

const defaultLinting = [
  {
    category: 'error',
    id: 'foo',
    name: 'Foo',
    message: 'Foo message'
  }
];

function renderLintingTab(options = {}) {
  const {
    layout = defaultLayout,
    linting = defaultLinting,
    onAction = () => {},
    onLayoutChanged = () => {}
  } = options;

  return mount(
    <SlotFillRoot>
      <Panel
        layout={ layout }>
        <LintingTab
          layout={ layout }
          linting={ linting }
          onAction={ onAction }
          onLayoutChanged={ onLayoutChanged } />
      </Panel>
    </SlotFillRoot>
  );
}
