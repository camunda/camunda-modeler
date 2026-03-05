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

import SidePanel, { DEFAULT_WIDTH } from '../SidePanel';

const { spy } = sinon;

const noop = () => {};

const DummyIcon = (props) => <svg { ...props } />;


describe('<SidePanel>', function() {

  it('should render', function() {

    // when
    const { container } = createSidePanel();

    // then
    expect(container.querySelector('.side-panel')).to.exist;
  });


  it('should render with single tab', function() {

    // when
    const { container } = createSidePanel({
      tabs: [
        { id: 'foo', label: 'Foo', children: <div className="foo-content">Foo</div> }
      ]
    });

    // then
    expect(container.querySelector('.side-panel__content')).to.exist;
    expect(container.querySelector('.foo-content')).to.exist;
  });


  it('should NOT render tabs bar with single tab', function() {

    // when
    const { container } = createSidePanel({
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> }
      ]
    });

    // then
    expect(container.querySelector('.side-panel__tabs-bar')).not.to.exist;
  });


  it('should render tabs bar with multiple tabs', function() {

    // when
    const { container } = createSidePanel({
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> },
        { id: 'bar', label: 'Bar', children: <div>Bar</div> }
      ]
    });

    // then
    expect(container.querySelector('.side-panel__tabs-bar')).to.exist;
    expect(container.querySelectorAll('.side-panel__tab')).to.have.length(2);
  });


  it('should render tab icons', function() {

    // when
    const { container } = createSidePanel({
      tabs: [
        { id: 'foo', label: 'Foo', icon: DummyIcon, children: <div>Foo</div> },
        { id: 'bar', label: 'Bar', icon: DummyIcon, children: <div>Bar</div> }
      ]
    });

    // then
    expect(container.querySelectorAll('.side-panel__tab-icon')).to.have.length(2);
  });


  it('should set first tab active by default', function() {

    // when
    const { container } = createSidePanel({
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> },
        { id: 'bar', label: 'Bar', children: <div>Bar</div> }
      ]
    });

    // then
    const activeTab = container.querySelector('.side-panel__tab--active');

    expect(activeTab).to.exist;
    expect(activeTab.title).to.equal('Foo');
  });


  it('should set active tab from layout', function() {

    // when
    const { container } = createSidePanel({
      layout: {
        sidePanel: { open: true, width: DEFAULT_WIDTH, tab: 'bar' }
      },
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> },
        { id: 'bar', label: 'Bar', children: <div>Bar</div> }
      ]
    });

    // then
    const activeTab = container.querySelector('.side-panel__tab--active');

    expect(activeTab).to.exist;
    expect(activeTab.title).to.equal('Bar');
  });


  it('should switch tab on click', function() {

    // given
    const onLayoutChanged = spy();

    const { container } = createSidePanel({
      onLayoutChanged,
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> },
        { id: 'bar', label: 'Bar', children: <div>Bar</div> }
      ]
    });

    const tabs = container.querySelectorAll('.side-panel__tab');

    // when
    fireEvent.click(tabs[1]);

    // then
    expect(onLayoutChanged).to.have.been.calledOnce;

    const layoutArg = onLayoutChanged.firstCall.args[0];

    expect(layoutArg.sidePanel.tab).to.equal('bar');
    expect(layoutArg.sidePanel.open).to.be.true;
  });


  it('should close panel when clicking active tab', function() {

    // given
    const onLayoutChanged = spy();

    const { container } = createSidePanel({
      layout: {
        sidePanel: { open: true, width: DEFAULT_WIDTH, tab: 'foo' }
      },
      onLayoutChanged,
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> },
        { id: 'bar', label: 'Bar', children: <div>Bar</div> }
      ]
    });

    const tabs = container.querySelectorAll('.side-panel__tab');

    // when
    fireEvent.click(tabs[0]);

    // then
    expect(onLayoutChanged).to.have.been.calledOnce;

    const layoutArg = onLayoutChanged.firstCall.args[0];

    expect(layoutArg.sidePanel.open).to.be.false;
  });


  it('should render header', function() {

    // when
    const { container } = createSidePanel({
      header: <div className="custom-header">Header</div>,
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> }
      ]
    });

    // then
    expect(container.querySelector('.custom-header')).to.exist;
  });


  it('should call onLayoutChanged on resize', function() {

    // given
    const onLayoutChanged = spy();

    const { container } = createSidePanel({
      onLayoutChanged,
      tabs: [
        { id: 'foo', label: 'Foo', children: <div>Foo</div> }
      ]
    });

    const resizer = container.querySelector('[role="separator"]');

    // when
    fireEvent.mouseDown(resizer, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(window, { clientX: 0, clientY: 0 });
    fireEvent.mouseUp(window, { clientX: 0, clientY: 0 });

    // then
    expect(onLayoutChanged).to.have.been.called;
  });

});


// helpers //////////

function createSidePanel(options = {}) {
  const {
    layout = {},
    onLayoutChanged = noop,
    tabs = [],
    header
  } = options;

  return render(
    <SidePanel layout={ layout } onLayoutChanged={ onLayoutChanged }>
      { header && <SidePanel.Header>{ header }</SidePanel.Header> }
      { tabs.map(({ id, label, icon, children }) => (
        <SidePanel.Tab key={ id } id={ id } label={ label } icon={ icon }>
          { children }
        </SidePanel.Tab>
      )) }
    </SidePanel>
  );
}
