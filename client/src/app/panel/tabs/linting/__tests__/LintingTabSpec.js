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

    expect(wrapper.find('.linting-tab-item__label')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item__label').text()).to.equal('Foo');
    expect(wrapper.find('.linting-tab-item__content')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item__content').text()).to.equal('Foo message');
  });


  it('should render with documentation link', function() {

    // when
    const wrapper = renderLintingTab({
      linting: [
        {
          category: 'error',
          id: 'foo',
          name: 'Foo',
          message: 'Foo message',
          rule: 'foo-rule',
          meta: {
            documentation: {
              url: 'https://foo.bar'
            }
          }
        }
      ]
    });

    // then
    expect(wrapper.find('.linting-tab-item__label')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item__label').text()).to.equal('Foo');
    expect(wrapper.find('.linting-tab-item__content')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item__content').text()).to.equal('Foo message');
    expect(wrapper.find('.linting-tab-item__link')).to.have.length(1);
  });


  it('should render (rule error)', function() {

    // when
    const wrapper = renderLintingTab({
      linting: [
        {
          category: 'rule-error',
          message: 'Bar',
          rule: 'bar-rule'
        }
      ]
    });

    // then
    expect(wrapper.find('.linting-tab-item__label')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item__label').text()).to.equal('Rule error');
    expect(wrapper.find('.linting-tab-item__content')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item__content').text()).to.equal('Rule <bar-rule> errored with the following message: Bar');
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

    expect(wrapper.find('.linting-tab-item--empty')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item--empty').text()).to.equal('No problems found.');
  });


  it('should sort', function() {

    // when
    const wrapper = renderLintingTab({
      linting: [
        {
          category: 'error',
          id: 'foo',
          name: 'Foo',
          message: 'foo error',
          rule: 'foo-rule'
        },
        {
          category: 'error',
          id: 'bar',
          name: 'Bar 1',
          message: 'bar 1 error',
          rule: 'foo-rule'
        },
        {
          category: 'rule-error',
          message: 'Baz',
          rule: 'baz-rule'
        },
        {
          category: 'error',
          id: 'bar',
          name: 'Bar 2',
          message: 'bar 2 error',
          rule: 'bar-rule'
        },
        {
          category: 'warn',
          id: 'baz',
          message: 'baz 1 warning',
          rule: 'bar-rule'
        },
        {
          category: 'error',
          id: 'baz',
          message: 'baz 2 error',
          rule: 'baz-rule'
        },
        {
          category: 'info',
          id: 'baz',
          message: 'baz 1 info',
          rule: 'baz-rule'
        }
      ]
    });

    // then
    expect(wrapper.find('.linting-tab-item__label')).to.have.length(7);
    expect(wrapper.find('.linting-tab-item__content')).to.have.length(7);

    expect(wrapper.find('.linting-tab-item__label').at(0).text()).to.equal('Bar 1');
    expect(wrapper.find('.linting-tab-item__content').at(0).text()).to.equal('bar 1 error');

    expect(wrapper.find('.linting-tab-item__label').at(1).text()).to.equal('Bar 2');
    expect(wrapper.find('.linting-tab-item__content').at(1).text()).to.equal('bar 2 error');

    expect(wrapper.find('.linting-tab-item__label').at(2).text()).to.equal('baz');
    expect(wrapper.find('.linting-tab-item__content').at(2).text()).to.equal('baz 2 error');

    expect(wrapper.find('.linting-tab-item__label').at(3).text()).to.equal('Foo');
    expect(wrapper.find('.linting-tab-item__content').at(3).text()).to.equal('foo error');

    expect(wrapper.find('.linting-tab-item__label').at(4).text()).to.equal('baz');
    expect(wrapper.find('.linting-tab-item__content').at(4).text()).to.equal('baz 1 warning');

    expect(wrapper.find('.linting-tab-item__label').at(5).text()).to.equal('baz');
    expect(wrapper.find('.linting-tab-item__content').at(5).text()).to.equal('baz 1 info');

    expect(wrapper.find('.linting-tab-item__label').at(6).text()).to.equal('Rule error');
    expect(wrapper.find('.linting-tab-item__content').at(6).text()).to.equal('Rule <baz-rule> errored with the following message: Baz');
  });

  it('should render when report is missing id and name', function() {

    // when
    const wrapper = renderLintingTab({
      linting: [
        {
          category: 'error',
          message: 'foo error',
          rule: 'foo-rule'
        }
      ]
    });

    // then
    expect(wrapper.find('.linting-tab-item')).to.have.length(1);
    expect(wrapper.find('.linting-tab-item__label').at(0).text()).to.equal('');
    expect(wrapper.find('.linting-tab-item__content').at(0).text()).to.equal('foo error');
  });


  it('should show lint error on click', function() {

    // given
    const onActionSpy = spy();

    const wrapper = renderLintingTab({
      onAction: onActionSpy
    });

    // when
    wrapper.find('.linting-tab-item').at(0).simulate('click');

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
    message: 'Foo message',
    rule: 'foo-rule'
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
