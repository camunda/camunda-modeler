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

import React, { Component } from 'react';

import { render, waitFor, act, within } from '@testing-library/react';

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

      // when
      const tab = createTab({
        children: <div data-testid="foo" />
      });

      const { queryByTestId, getByRole } = renderPanel({
        children: tab
      });

      const fooTab = getByRole('button', { name: 'Foo' });

      // then
      expect(fooTab.className).to.include('panel__link--active');
      expect(within(fooTab).queryByText('Foo')).to.exist;

      expect(queryByTestId('foo')).to.exist;
    });


    it('should add Tab as Plugin', function() {

      // when
      const { queryByTestId, getByRole } = renderPanel({
        children: <Fill slot="bottom-panel" label="Foo" id="foo">
          <div data-testid="foo" />
        </Fill>
      });

      // then
      const fooTab = getByRole('button', { name: 'Foo' });

      expect(fooTab.className).to.include('panel__link--active');
      expect(within(fooTab).queryByText('Foo')).to.exist;

      expect(queryByTestId('foo')).to.exist;
    });


    it('should update Tab on prop changes', async function() {

      // given
      const customCompRef = React.createRef();
      class CustomComponent extends Component {
        constructor(props) {
          super(props);
          this.state = { label: 'Foo' };
        }

        render() {
          const { label } = this.state;

          return <Fill slot="bottom-panel" label={ label } id="foo">
            <div className={ 'foo' } />
          </Fill>;
        }
      }

      const { getByRole } = renderPanel({
        children: <CustomComponent ref={ customCompRef } />
      });

      // assume
      const fooTab = getByRole('button', { name: 'Foo' });

      expect(fooTab.className).to.include('panel__link--active');

      expect(within(fooTab).queryByText('Foo')).to.exist;

      // when
      customCompRef.current.setState({ label: 'Bar' });

      await waitFor(() => {
        expect(within(fooTab).queryByText('Bar')).to.exist;
        expect(fooTab.className).to.include('panel__link--active');
      });
    });


    it('should render two tabs', async function() {

      // when
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

      const { container, queryByTestId, getByRole } = renderPanel({
        children: [ tab1, tab2 ]
      });

      const fooTab = getByRole('button', { name: 'Foo' });
      const barTab = getByRole('button', { name: 'Bar' });

      const { queryByText: queryByTextInFooTab } = within(fooTab);
      const { queryByText: queryByTextInBarTab } = within(barTab);

      // then
      expect(container.querySelectorAll('.panel__link')).to.have.length(2);
      expect(container.querySelectorAll('.panel__link--active')).to.have.length(1);

      expect(queryByTextInFooTab('Foo')).to.exist;
      expect(fooTab.className).to.include('panel__link--active');

      expect(queryByTextInBarTab('Bar')).to.exist;

      expect(queryByTestId('foo')).to.exist;
      expect(queryByTestId('bar')).to.not.exist;
    });


    it('should render two tabs with priority', function() {

      // when
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
      const { container, queryByTestId } = renderPanel({
        children: [ tab, priorityTab ]
      });

      const tabs = within(container).getAllByRole('button');

      // then
      expect(container.querySelectorAll('.panel__link')).to.have.length(2);
      expect(container.querySelectorAll('.panel__link--active')).to.have.length(1);

      expect(within(tabs[0]).getByText('Bar')).to.exist;
      expect(within(tabs[1]).getByText('Foo')).to.exist;

      expect(tabs[1].className).to.include('panel__link--active');

      expect(queryByTestId('foo')).to.exist;
      expect(queryByTestId('bar')).to.not.exist;
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
      await act(() => userEvent.click(getByRole('button', { name: 'Bar' })));

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
      await act(() => userEvent.click(container.querySelector('.panel__body')));

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