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

import { render } from '@testing-library/react';

import {
  SidePanelGroup,
  getSiblingsWidth,
  MIN_PANEL_WIDTH,
  SidePanelConsumer
} from '../SidePanelGroup';

const { spy } = sinon;

describe('SidePanelGroup', function() {

  describe('<SidePanelGroup>', function() {

    it('should render', function() {

      // when
      const { container } = renderSidePanelGroup();

      // then
      expect(container.firstChild).to.exist;
    });


    it('should render children', function() {

      // when
      const { container } = renderSidePanelGroup({
        children: [
          <PanelStub key="a" panelId="panelA">A</PanelStub>,
          <PanelStub key="b" panelId="panelB">B</PanelStub>
        ]
      });

      // then
      expect(container.querySelector('[data-panel-id="panelA"]')).to.exist;
      expect(container.querySelector('[data-panel-id="panelB"]')).to.exist;
    });


    it('should inject maxWidth into children', function() {

      // when
      const { container } = renderSidePanelGroup({
        layout: {
          panelA: { open: true, width: 300 }
        },
        children: [
          <PanelStub key="a" panelId="panelA" />,
          <PanelStub key="b" panelId="panelB" />
        ]
      });

      // then
      const panelA = container.querySelector('[data-panel-id="panelA"]');
      const panelB = container.querySelector('[data-panel-id="panelB"]');

      expect(panelA.dataset.maxWidth).to.exist;
      expect(panelB.dataset.maxWidth).to.exist;
    });


    it('should inject onLayoutChanged into children', function() {

      // given
      const onLayoutChanged = spy();

      // when
      let injectedCallback;

      renderSidePanelGroup({
        onLayoutChanged,
        children: [
          <SidePanelConsumer key="a" panelId="panelA">
            { ({ onLayoutChanged: injected }) => {
              injectedCallback = injected;
              return <div data-panel-id="panelA" />;
            } }
          </SidePanelConsumer>
        ]
      });

      // when
      injectedCallback({ panelA: { open: true, width: 200 } });

      // then
      expect(onLayoutChanged).to.have.been.calledOnce;
    });


    it('should limit width in onLayoutChanged callback', function() {

      // given
      const onLayoutChanged = spy();

      let injectedCallback;

      // Container width is 0 (no ResizeObserver in test), so maxWidth will be negative.
      // We use a layout where sibling is open with width 0 to keep it simple.
      // maxWidth = containerWidth(0) - siblingsWidth(0) - MIN_CANVAS_WIDTH(200) = -200
      // Any positive width should be capped.
      renderSidePanelGroup({
        onLayoutChanged,
        layout: {},
        children: [
          <SidePanelConsumer key="a" panelId="panelA">
            { ({ onLayoutChanged: injected }) => {
              injectedCallback = injected;
              return <div data-panel-id="panelA" />;
            } }
          </SidePanelConsumer>
        ]
      });

      // when
      injectedCallback({ panelA: { open: true, width: 500 } });

      // then
      expect(onLayoutChanged).to.have.been.calledOnce;

      const update = onLayoutChanged.firstCall.args[0];

      expect(update.panelA.width).to.be.at.most(500);
    });


    it('should pass through non-width layout updates unchanged', function() {

      // given
      const onLayoutChanged = spy();

      let injectedCallback;

      renderSidePanelGroup({
        onLayoutChanged,
        children: [
          <SidePanelConsumer key="a" panelId="panelA">
            { ({ onLayoutChanged: injected }) => {
              injectedCallback = injected;
              return <div data-panel-id="panelA" />;
            } }
          </SidePanelConsumer>
        ]
      });

      // when
      injectedCallback({ panelA: { open: false, tab: 'properties' } });

      // then
      expect(onLayoutChanged).to.have.been.calledOnce;

      const update = onLayoutChanged.firstCall.args[0];

      expect(update.panelA.open).to.be.false;
      expect(update.panelA.tab).to.equal('properties');
    });


    it('should not return negative maxWidth when container is unmeasured', function() {

      // when
      const { container } = renderSidePanelGroup({
        layout: {
          panelA: { open: true, width: 400 },
          panelB: { open: true, width: 300 }
        },
        children: [
          <PanelStub key="a" panelId="panelA" />,
          <PanelStub key="b" panelId="panelB" />
        ]
      });

      // then - maxWidth should be clamped to 0, not negative
      const panelA = container.querySelector('[data-panel-id="panelA"]');
      const panelB = container.querySelector('[data-panel-id="panelB"]');

      expect(Number(panelA.dataset.maxWidth)).to.equal(0);
      expect(Number(panelB.dataset.maxWidth)).to.equal(0);
    });


    it('should not account for closed sibling width', function() {

      // given
      const panelIds = [ 'panelA', 'panelB' ];
      const layout = {
        panelA: { open: true, width: 400 },
        panelB: { open: false, width: 300 }
      };

      // when
      const siblingsOfA = getSiblingsWidth('panelA', panelIds, layout);
      const siblingsOfB = getSiblingsWidth('panelB', panelIds, layout);

      // then - panelA should not subtract closed panelB's width
      expect(siblingsOfA).to.equal(0);
      expect(siblingsOfB).to.equal(400);
    });

  });


  describe('getSiblingsWidth', function() {

    it('should return 0 when no siblings exist', function() {

      // given
      const panelIds = [ 'a' ];
      const layout = {
        a: { open: true, width: 500 }
      };

      // when
      const result = getSiblingsWidth('a', panelIds, layout);

      // then
      expect(result).to.equal(0);
    });


    it('should sum open siblings widths', function() {

      // given
      const panelIds = [ 'a', 'b', 'c' ];
      const layout = {
        a: { open: true, width: 300 },
        b: { open: true, width: 400 },
        c: { open: true, width: 350 }
      };

      // when
      const result = getSiblingsWidth('a', panelIds, layout);

      // then
      expect(result).to.equal(400 + 350);
    });


    it('should ignore closed siblings', function() {

      // given
      const panelIds = [ 'a', 'b' ];
      const layout = {
        a: { open: true, width: 300 },
        b: { open: false, width: 400 }
      };

      // when
      const result = getSiblingsWidth('a', panelIds, layout);

      // then
      expect(result).to.equal(0);
    });


    it('should use MIN_PANEL_WIDTH as minimum for open siblings', function() {

      // given
      const panelIds = [ 'a', 'b' ];
      const layout = {
        a: { open: true, width: 300 },
        b: { open: true, width: 100 }
      };

      // when
      const result = getSiblingsWidth('a', panelIds, layout);

      // then
      expect(result).to.equal(MIN_PANEL_WIDTH);
    });

  });

});


// helpers //////////

function renderSidePanelGroup(options = {}) {
  const {
    layout = {},
    onLayoutChanged = noop,
    children = [
      <PanelStub key="default" panelId="default" />
    ]
  } = options;

  const panelIds = React.Children.toArray(children).map(c => c.props.panelId);

  return render(
    <SidePanelGroup panelIds={ panelIds } layout={ layout } onLayoutChanged={ onLayoutChanged }>
      { children }
    </SidePanelGroup>
  );
}

function PanelStub({ panelId, children }) {
  return (
    <SidePanelConsumer panelId={ panelId }>
      { ({ maxWidth }) => (
        <div
          data-panel-id={ panelId }
          data-max-width={ maxWidth }
        >
          { children }
        </div>
      ) }
    </SidePanelConsumer>
  );
}

const noop = () => { };
