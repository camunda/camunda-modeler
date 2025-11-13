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

import { fireEvent, render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { Fill, SlotFillRoot } from '../../slot-fill';

import Panel from '../Panel';

const noop = () => {};

const spy = sinon.spy;


describe('<Panel>', function() {

  it('should render', function() {

    // when
    const { container } = renderPanel();

    // then
    expect(container.querySelector('.panel__header')).to.exist;
    expect(container.querySelector('.panel__body')).to.exist;
  });


  describe('tabs', function() {

    it('should render tab', function() {

      // given
      const tab = createTab({
        children: <div data-testid="tab-content" />
      });

      // when
      const { getByRole, getByTestId } = renderPanel({
        children: tab
      });

      // then
      expect(getByRole('button', { name: 'Foo' })).to.exist;
      expect(getByTestId('tab-content')).to.exist;
      expect(getByRole('button', { name: 'Foo' }).classList.contains('panel__link--active')).to.be.true;
    });


    it('should add Tab as Plugin', function() {

      // given
      const tab = (
        <Fill slot="bottom-panel" label="Foo" id="foo">
          <div data-testid="tab-content" />
        </Fill>
      );

      // when
      const { getByRole, getByTestId } = renderPanel({
        children: tab
      });

      // then
      expect(getByRole('button', { name: 'Foo' })).to.exist;
      expect(getByTestId('tab-content')).to.exist;
    });


    it('should render two tabs', async function() {

      // given
      const tab1 = createTab({
        id: 'foo',
        label: 'Foo',
        children: <div data-testid="foo" />
      });

      const tab2 = createTab({
        id: 'bar',
        label: 'Bar',
        children: <div data-testid="bar" />
      });

      // when
      const { queryByTestId, getByRole } = renderPanel({
        children: [ tab1, tab2 ]
      });

      // then
      expect(getByRole('button', { name: 'Foo' })).to.exist;
      expect(queryByTestId('foo')).to.exist;

      expect(getByRole('button', { name: 'Bar' })).to.exist;
      expect(queryByTestId('bar')).to.not.exist;
    });


    it('should render two tabs ordered by priority', function() {

      // given
      const tab = createTab({
        id: 'foo',
        label: 'Foo',
        children: <div data-testid="foo" />
      });

      const priorityTab = createTab({
        id: 'bar',
        label: 'Bar',
        priority: 2,
        children: <div data-testid="bar" />
      });

      // when
      const { getAllByRole } = renderPanel({
        children: [ tab, priorityTab ]
      });

      // then
      const tabs = getAllByRole('button', { name: /foo|bar/i });
      expect(tabs[0].textContent).to.eql('Bar');
      expect(tabs[1].textContent).to.eql('Foo');
    });


    it('should render number', function() {

      // when
      const tab = createTab({
        number: 123
      });

      const { getByText } = renderPanel({
        children: tab
      });

      // then
      expect(getByText('123')).to.exist;
    });


    it('should change layout on click', async function() {

      // given
      const onLayoutChangedSpy = spy();

      const tab1 = createTab({
        id: 'foo',
        label: 'Foo',
        children: <div className="foo" />
      });

      const tab2 = createTab({
        id: 'bar',
        label: 'Bar',
        children: <div className="bar" />
      });

      const { getByRole } = renderPanel({
        children: [ tab1, tab2 ],
        onLayoutChanged: onLayoutChangedSpy,
      });

      // when
      await userEvent.click(getByRole('button', { name: 'Bar' }));

      // then
      expect(onLayoutChangedSpy).to.have.been.calledWith({
        panel: {
          open: true,
          tab: 'bar'
        }
      });
    });


    it('should update edit menu', async function() {

      // given
      const onUpdateMenu = spy();

      const tab = createTab({
        children: <div className="foo" />
      });

      const { container } = renderPanel({
        children: tab,
        onUpdateMenu
      });

      // when
      fireEvent.focus(container.querySelector('.panel__body'));

      // then
      expect(onUpdateMenu).to.be.calledOnceWithExactly({
        editMenu: [
          [
            { enabled: false, role: 'undo' },
            { enabled: false, role: 'redo' }
          ],
          [
            { enabled: false, role: 'copy' },
            { enabled: false, role: 'cut' },
            { enabled: false, role: 'paste' },
            { enabled: false, role: 'selectAll' }
          ]
        ]
      });
    });

  });

});


// helpers //////////

const defaultLayout = {
  panel: {
    open: true,
    tab: 'foo'
  }
};

function createTab(options = {}) {
  const {
    children = null,
    id = 'foo',
    label = 'Foo',
    layout = defaultLayout,
    number,
    onLayoutChanged = noop,
    priority = 1
  } = options;

  return <Panel.Tab
    id={ id }
    key={ id }
    label={ label }
    layout={ layout }
    number={ number }
    onLayoutChanged={ onLayoutChanged }
    priority={ priority }>
    {
      children
    }
  </Panel.Tab>;
}

function renderPanel(options = {}) {
  const {
    children,
    layout = defaultLayout,
    onLayoutChanged = noop,
    onUpdateMenu = noop
  } = options;

  return render(
    <SlotFillRoot>
      <Panel
        layout={ layout }
        onUpdateMenu={ onUpdateMenu }
        onLayoutChanged={ onLayoutChanged }>
        { children }
      </Panel>
    </SlotFillRoot>
  );
}