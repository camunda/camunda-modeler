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

import { render, waitFor, act } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { Fill, SlotFillRoot } from '../../slot-fill';

import Panel from '../Panel';

const noop = () => {};

const spy = sinon.spy;


describe('<Panel>', function() {

  it('should render', function() {

    // when
    const { queryByTestId } = renderPanel();

    // then
    expect(queryByTestId('panel__header')).to.exist;
    expect(queryByTestId('panel__body')).to.exist;
  });


  describe('tabs', function() {

    it('should render tab', function() {

      // when
      const tab = createTab({
        children: <div data-testid="foo" />
      });

      const { queryByTestId } = renderPanel({
        children: tab
      });

      const tabTest = queryByTestId(`tab-${tab.key}`);

      // then
      expect(tabTest).to.exist;
      expect(tabTest.className).to.include('panel__link--active');
      expect(tabTest.querySelector('.panel__link-label').textContent).to.equal('Foo');

      expect(queryByTestId('foo')).to.exist;
    });


    it('should add Tab as Plugin', function() {

      // when
      const { queryByTestId } = renderPanel({
        children: <Fill slot="bottom-panel" label="Foo" id="foo">
          <div data-testid="foo" />
        </Fill>
      });

      // then
      const tabTest = queryByTestId('tab-foo');

      expect(tabTest).to.exist;
      expect(tabTest.className).to.include('panel__link--active');

      expect(tabTest.querySelector('.panel__link-label').textContent).to.equal('Foo');

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

      const { queryByTestId } = renderPanel({
        children: <CustomComponent ref={ customCompRef } />
      });

      // assume
      const tabTest = queryByTestId('tab-foo');

      expect(tabTest).to.exist;
      expect(tabTest.className).to.include('panel__link--active');

      expect(tabTest.querySelector('.panel__link-label').textContent).to.equal('Foo');

      // when
      customCompRef.current.setState({ label: 'Bar' });

      await waitFor(() => {
        expect(tabTest.querySelector('.panel__link-label').textContent).to.equal('Bar');
        expect(tabTest.className).to.include('panel__link--active');
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

      const { container, queryByTestId } = renderPanel({
        children: [ tab1, tab2 ]
      });

      // then
      expect(container.querySelectorAll('.panel__link')).to.have.length(2);
      expect(container.querySelectorAll('.panel__link--active')).to.have.length(1);

      expect(queryByTestId(`tab-${tab1.key}`).querySelector('.panel__link-label').textContent).to.equal('Foo');
      expect(queryByTestId(`tab-${tab1.key}`).className).to.include('panel__link--active');

      expect(queryByTestId(`tab-${tab2.key}`).querySelector('.panel__link-label').textContent).to.equal('Bar');

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

      // then
      expect(container.querySelectorAll('.panel__link')).to.have.length(2);
      expect(container.querySelectorAll('.panel__link--active')).to.have.length(1);

      expect(container.querySelectorAll('.panel__link')[0].querySelector('.panel__link-label').textContent).to.equal('Bar');
      expect(container.querySelectorAll('.panel__link')[1].querySelector('.panel__link-label').textContent).to.equal('Foo');
      expect(queryByTestId(`tab-${tab.key}`).className).to.include('panel__link--active');

      expect(queryByTestId('foo')).to.exist;
      expect(queryByTestId('bar')).to.not.exist;
    });


    it('should render number', function() {

      // when

      const tab = createTab({
        children: <div data-testid="foo" />,
        number: 123
      });
      const { queryByTestId } = renderPanel({
        children: tab
      });

      const tabTest = queryByTestId(`tab-${tab.key}`);

      // then
      expect(tabTest).to.exist;
      expect(tabTest.className).to.include('panel__link--active');

      expect(tabTest.querySelector('.panel__link-label').textContent).to.equal('Foo');

      expect(tabTest.querySelector('.panel__link-number')).to.exist;
      expect(tabTest.querySelector('.panel__link-number').textContent).to.equal('123');

      expect(queryByTestId('foo')).to.exist;
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

      const { queryByTestId } = renderPanel({
        children: [ tab1, tab2 ],
        onLayoutChanged: onLayoutChangedSpy,
      });

      // when
      await act(() => userEvent.click(queryByTestId(`tab-${tab2.key}`)));

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

      const { queryByTestId } = renderPanel({
        children: tab,
        onUpdateMenu
      });

      // when
      await act(() => userEvent.click(queryByTestId('panel__body')));

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