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

import { SlotFillRoot } from '../../../slot-fill';

import Panel from '../Panel';

const noop = () => {};

const spy = sinon.spy;


describe('<Panel>', function() {

  it('should render (open)', function() {

    // when
    const wrapper = renderPanel();

    // then
    expect(wrapper.find('.panel__body')).to.have.length(1);
  });


  it('should render (closed)', function() {

    // when
    const wrapper = renderPanel({
      layout: {
        panel: {
          open: false
        }
      }
    });

    // then
    expect(wrapper.find('.panel__body')).to.have.length(1);
  });


  describe('tabs', function() {

    it('should render tab', function() {

      // when
      const wrapper = renderPanel({
        children: createTab({
          children: <div className="foo" />
        })
      });

      // then
      expect(wrapper.find('.panel__link')).to.have.length(1);
      expect(wrapper.find('.panel__link--active')).to.have.length(1);

      expect(wrapper.find('.panel__link').at(0).find('.panel__link-label').text()).to.equal('Foo');
      expect(wrapper.find('.panel__link').at(0).hasClass('panel__link--active')).to.be.true;

      expect(wrapper.find('.foo')).to.have.length(1);
    });


    it('should render two tabs', function() {

      // when
      const wrapper = renderPanel({
        children: [
          createTab({
            id: 'foo',
            label: 'Foo',
            children: <div className="foo" />
          }),
          createTab({
            id: 'bar',
            label: 'Bar',
            children: <div className="bar" />
          })
        ]
      });

      // then
      expect(wrapper.find('.panel__link')).to.have.length(2);
      expect(wrapper.find('.panel__link--active')).to.have.length(1);

      expect(wrapper.find('.panel__link').at(0).find('.panel__link-label').text()).to.equal('Foo');
      expect(wrapper.find('.panel__link').at(0).hasClass('panel__link--active')).to.be.true;
      expect(wrapper.find('.panel__link').at(1).find('.panel__link-label').text()).to.equal('Bar');

      expect(wrapper.find('.foo')).to.have.length(1);
      expect(wrapper.find('.bar')).to.have.length(0);
    });


    it('should render two tabs with priority', function() {

      // when
      const wrapper = renderPanel({
        children: [
          createTab({
            id: 'foo',
            label: 'Foo',
            children: <div className="foo" />
          }),
          createTab({
            id: 'bar',
            label: 'Bar',
            priority: 2,
            children: <div className="bar" />
          })
        ]
      });

      // then
      expect(wrapper.find('.panel__link')).to.have.length(2);
      expect(wrapper.find('.panel__link--active')).to.have.length(1);

      expect(wrapper.find('.panel__link').at(0).find('.panel__link-label').text()).to.equal('Bar');
      expect(wrapper.find('.panel__link').at(1).find('.panel__link-label').text()).to.equal('Foo');
      expect(wrapper.find('.panel__link').at(1).hasClass('panel__link--active')).to.be.true;

      expect(wrapper.find('.foo')).to.have.length(1);
      expect(wrapper.find('.bar')).to.have.length(0);
    });


    it('should render number', function() {

      // when
      const wrapper = renderPanel({
        children: createTab({
          children: <div className="foo" />,
          number: 123
        })
      });

      // then
      expect(wrapper.find('.panel__link')).to.have.length(1);
      expect(wrapper.find('.panel__link--active')).to.have.length(1);

      expect(wrapper.find('.panel__link').at(0).find('.panel__link-label').text()).to.equal('Foo');
      expect(wrapper.find('.panel__link').at(0).hasClass('panel__link--active')).to.be.true;

      expect(wrapper.find('.panel__link-number')).to.have.length(1);
      expect(wrapper.find('.panel__link-number').text()).to.equal('123');

      expect(wrapper.find('.foo')).to.have.length(1);
    });


    it('should change layout on click', function() {

      // given
      const onLayoutChangedSpy = spy();

      const wrapper = renderPanel({
        children: [
          createTab({
            id: 'foo',
            label: 'Foo',
            onLayoutChanged: onLayoutChangedSpy,
            children: <div className="foo" />
          }),
          createTab({
            id: 'bar',
            label: 'Bar',
            onLayoutChanged: onLayoutChangedSpy,
            children: <div className="bar" />
          })
        ]
      });

      // when
      wrapper.find('.panel__link').at(1).simulate('click');

      // then
      expect(onLayoutChangedSpy).to.have.been.calledWith({
        panel: {
          open: true,
          tab: 'bar'
        }
      });
    });


    it('should change layout on resize', function() {

      // given
      const onLayoutChangedSpy = spy();

      const layout = {
        panel: {
          open: true,
          height: 300
        }
      };

      const wrapper = renderPanel({
        children: createTab({
          children: <div className="foo" />
        }),
        layout,
        onLayoutChanged: onLayoutChangedSpy
      });

      const resizableContainer = wrapper.find('ResizableContainer').first().instance();

      // when
      resizableContainer.handleResizeStart(createMouseEvent('dragstart', 0, 0));

      resizableContainer.handleContainerResize(null, { y: -50 });

      resizableContainer.handleResizeEnd();

      // then
      expect(onLayoutChangedSpy).to.be.calledWith({
        panel: {
          open: true,
          height: 350,
          fullHeight: false
        }
      });
    });


    it('should update edit menu', async function() {

      // given
      const onUpdateMenu = spy();

      const wrapper = renderPanel({
        children: createTab({
          children: <div className="foo" />
        }),
        onUpdateMenu
      });

      // when
      wrapper.find('.panel__body').simulate('focus');

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
    onUpdateMenu = noop,
    onLayoutChanged = noop
  } = options;

  return mount(
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

function createMouseEvent(type, clientX, clientY) {
  const event = document.createEvent('MouseEvent');

  if (event.initMouseEvent) {
    event.initMouseEvent(
      type, true, true, window, 0, 0, 0, clientX, clientY, false, false, false, false, 0, null);
  }

  return event;
}