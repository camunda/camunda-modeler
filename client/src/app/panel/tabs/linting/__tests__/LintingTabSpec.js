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

import LintingTab from '../LintingTab';

const spy = sinon.spy;


describe('<LintingTab>', function() {

  it('should render', function() {

    // when
    const { container } = renderLintingTab();

    // then
    expect(container.querySelectorAll('.panel__link')).to.have.length(1);
    expect(container.querySelectorAll('.panel__link--active')).to.have.length(1);

    const panelLink = container.querySelector('.panel__link');
    expect(panelLink.querySelector('.panel__link-label').textContent).to.equal('Problems');
    expect(panelLink.classList.contains('panel__link--active')).to.be.true;

    expect(container.querySelectorAll('.linting-tab-item__label')).to.have.length(1);
    expect(container.querySelector('.linting-tab-item__label').textContent).to.equal('Foo');
    expect(container.querySelectorAll('.linting-tab-item__content')).to.have.length(1);
    expect(container.querySelector('.linting-tab-item__content').textContent).to.equal('Foo message');
  });


  it('should render with documentation link', function() {

    // when
    const { container } = renderLintingTab({
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
    expect(container.querySelectorAll('.linting-tab-item__label')).to.have.length(1);
    expect(container.querySelector('.linting-tab-item__label').textContent).to.equal('Foo');
    expect(container.querySelectorAll('.linting-tab-item__content')).to.have.length(1);
    expect(container.querySelector('.linting-tab-item__content').textContent).to.equal('Foo message');
    expect(container.querySelectorAll('.linting-tab-item__link')).to.have.length(1);
  });


  it('should render (rule error)', function() {

    // when
    const { container } = renderLintingTab({
      linting: [
        {
          category: 'rule-error',
          message: 'Bar',
          rule: 'bar-rule'
        }
      ]
    });

    // then
    expect(container.querySelectorAll('.linting-tab-item__label')).to.have.length(1);
    expect(container.querySelector('.linting-tab-item__label').textContent).to.equal('Rule error');
    expect(container.querySelectorAll('.linting-tab-item__content')).to.have.length(1);
    expect(container.querySelector('.linting-tab-item__content').textContent).to.equal('Rule <bar-rule> errored with the following message: Bar');
  });


  it('should render (no problems)', function() {

    // when
    const { container } = renderLintingTab({
      linting: []
    });

    // then
    expect(container.querySelectorAll('.panel__link')).to.have.length(1);
    expect(container.querySelectorAll('.panel__link--active')).to.have.length(1);

    const panelLink = container.querySelector('.panel__link');
    expect(panelLink.querySelector('.panel__link-label').textContent).to.equal('Problems');
    expect(panelLink.classList.contains('panel__link--active')).to.be.true;

    expect(container.querySelectorAll('.linting-tab-item--empty')).to.have.length(1);
    expect(container.querySelector('.linting-tab-item--empty').textContent).to.equal('No problems found.');
  });


  it('should sort', function() {

    // when
    const { container } = renderLintingTab({
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
    const labels = container.querySelectorAll('.linting-tab-item__label');
    const contents = container.querySelectorAll('.linting-tab-item__content');

    expect(labels).to.have.length(7);
    expect(contents).to.have.length(7);

    expect(labels[0].textContent).to.equal('Bar 1');
    expect(contents[0].textContent).to.equal('bar 1 error');

    expect(labels[1].textContent).to.equal('Bar 2');
    expect(contents[1].textContent).to.equal('bar 2 error');

    expect(labels[2].textContent).to.equal('baz');
    expect(contents[2].textContent).to.equal('baz 2 error');

    expect(labels[3].textContent).to.equal('Foo');
    expect(contents[3].textContent).to.equal('foo error');

    expect(labels[4].textContent).to.equal('baz');
    expect(contents[4].textContent).to.equal('baz 1 warning');

    expect(labels[5].textContent).to.equal('baz');
    expect(contents[5].textContent).to.equal('baz 1 info');

    expect(labels[6].textContent).to.equal('Rule error');
    expect(contents[6].textContent).to.equal('Rule <baz-rule> errored with the following message: Baz');
  });

  it('should render when report is missing id and name', function() {

    // when
    const { container } = renderLintingTab({
      linting: [
        {
          category: 'error',
          message: 'foo error',
          rule: 'foo-rule'
        }
      ]
    });

    // then
    const labels = container.querySelectorAll('.linting-tab-item__label');
    const contents = container.querySelectorAll('.linting-tab-item__content');

    expect(container.querySelectorAll('.linting-tab-item')).to.have.length(1);
    expect(labels[0].textContent).to.equal('');
    expect(contents[0].textContent).to.equal('foo error');
  });


  it('should show lint error on click', function() {

    // given
    const onActionSpy = spy();

    const { container } = renderLintingTab({
      onAction: onActionSpy
    });

    // when
    fireEvent.click(container.querySelector('.linting-tab-item'));

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

  return render(
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
