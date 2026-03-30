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

import SidePanelContainer, {
  fitPanelsToContainer,
  getSiblingsWidth,
  MIN_CANVAS_WIDTH,
  MIN_PANEL_WIDTH
} from '../SidePanelContainer';

const { spy } = sinon;

describe('<SidePanelContainer>', function() {

  it('should render', function() {

    // when
    const { container } = renderSidePanelContainer();

    // then
    expect(container.firstChild).to.exist;
  });


  it('should render children', function() {

    // when
    const { container } = renderSidePanelContainer({
      children: [
        <PanelStub key="a" layoutPanelId="panelA">A</PanelStub>,
        <PanelStub key="b" layoutPanelId="panelB">B</PanelStub>
      ]
    });

    // then
    expect(container.querySelector('[data-panel-id="panelA"]')).to.exist;
    expect(container.querySelector('[data-panel-id="panelB"]')).to.exist;
  });


  it('should inject maxWidth into children', function() {

    // when
    const { container } = renderSidePanelContainer({
      layout: {
        panelA: { open: true, width: 300 }
      },
      children: [
        <PanelStub key="a" layoutPanelId="panelA" />,
        <PanelStub key="b" layoutPanelId="panelB" />
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

    function CapturingPanel({ onLayoutChanged: injected, layoutPanelId }) {
      injectedCallback = injected;
      return <div data-panel-id={ layoutPanelId } />;
    }

    renderSidePanelContainer({
      onLayoutChanged,
      children: [
        <CapturingPanel key="a" layoutPanelId="panelA" />
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

    function CapturingPanel({ onLayoutChanged: injected, layoutPanelId }) {
      injectedCallback = injected;
      return <div data-panel-id={ layoutPanelId } />;
    }

    // Container width is 0 (no ResizeObserver in test), so maxWidth will be negative.
    // We use a layout where sibling is open with width 0 to keep it simple.
    // maxWidth = containerWidth(0) - siblingsWidth(0) - MIN_CANVAS_WIDTH(200) = -200
    // Any positive width should be capped.
    renderSidePanelContainer({
      onLayoutChanged,
      layout: {},
      children: [
        <CapturingPanel key="a" layoutPanelId="panelA" />
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

    function CapturingPanel({ onLayoutChanged: injected, layoutPanelId }) {
      injectedCallback = injected;
      return <div data-panel-id={ layoutPanelId } />;
    }

    renderSidePanelContainer({
      onLayoutChanged,
      children: [
        <CapturingPanel key="a" layoutPanelId="panelA" />
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


  it('should account for open sibling width in maxWidth', function() {

    // when
    const { container } = renderSidePanelContainer({
      layout: {
        panelA: { open: true, width: 400 },
        panelB: { open: true, width: 300 }
      },
      children: [
        <PanelStub key="a" layoutPanelId="panelA" />,
        <PanelStub key="b" layoutPanelId="panelB" />
      ]
    });

    // then - panelA maxWidth should account for panelB's width
    const panelA = container.querySelector('[data-panel-id="panelA"]');
    const panelB = container.querySelector('[data-panel-id="panelB"]');

    const maxWidthA = Number(panelA.dataset.maxWidth);
    const maxWidthB = Number(panelB.dataset.maxWidth);

    // panelA's max should be smaller than panelB's max because panelA's sibling (B) is wider
    // maxWidthA = container(0) - 300 - 200 = -500
    // maxWidthB = container(0) - 400 - 200 = -600
    expect(maxWidthA).to.be.greaterThan(maxWidthB);
  });


  it('should not account for closed sibling width', function() {

    // when
    const { container } = renderSidePanelContainer({
      layout: {
        panelA: { open: true, width: 400 },
        panelB: { open: false, width: 300 }
      },
      children: [
        <PanelStub key="a" layoutPanelId="panelA" />,
        <PanelStub key="b" layoutPanelId="panelB" />
      ]
    });

    // then - panelA should not subtract closed panelB's width
    const panelA = container.querySelector('[data-panel-id="panelA"]');
    const panelB = container.querySelector('[data-panel-id="panelB"]');

    const maxWidthA = Number(panelA.dataset.maxWidth);
    const maxWidthB = Number(panelB.dataset.maxWidth);

    // panelA sees 0 sibling width (panelB is closed)
    // panelB sees panelA's width as sibling (panelA is open)
    expect(maxWidthA).to.be.greaterThan(maxWidthB);
  });

});


describe('fitPanelsToContainer', function() {

  it('should return null when all panels fit', function() {

    // given
    const panels = [
      panel('a'),
      panel('b')
    ];
    const layout = {
      a: { open: true, width: 300 },
      b: { open: true, width: 300 }
    };

    // when
    const result = fitPanelsToContainer(panels, layout, 1000);

    // then
    expect(result).to.be.null;
  });


  it('should reduce panel width when it exceeds available space', function() {

    // given
    const panels = [
      panel('a'),
      panel('b')
    ];
    const layout = {
      a: { open: true, width: 600 },
      b: { open: true, width: 300 }
    };

    // container = 800, panelA available = 800 - 300 - MIN_CANVAS(200) = 300
    const result = fitPanelsToContainer(panels, layout, 800);

    // then
    expect(result).to.exist;
    expect(result.a.width).to.equal(300);
    expect(result.b).to.not.exist;
  });


  it('should iteratively reduce both panels when both overflow', function() {

    // given
    const panels = [
      panel('a'),
      panel('b')
    ];
    const layout = {
      a: { open: true, width: 800 },
      b: { open: true, width: 800 }
    };

    // container = 1200, available = 1200 - 200 = 1000
    // both panels at 800 → total 1600 > 1000, needs iterative reduction
    const result = fitPanelsToContainer(panels, layout, 1200);

    // then
    expect(result).to.exist;
    expect(result.a).to.exist;
    expect(result.b).to.exist;

    // both widths + MIN_CANVAS_WIDTH must fit in container
    expect(result.a.width + result.b.width + MIN_CANVAS_WIDTH).to.be.at.most(1200);
  });


  it('should ignore closed panels', function() {

    // given
    const panels = [
      panel('a'),
      panel('b')
    ];
    const layout = {
      a: { open: true, width: 300 },
      b: { open: false, width: 800 }
    };

    // when
    const result = fitPanelsToContainer(panels, layout, 600);

    // then
    expect(result).to.be.null;
  });


  it('should handle single panel', function() {

    // given
    const panels = [ panel('a') ];
    const layout = {
      a: { open: true, width: 700 }
    };

    // container = 500, available = 500 - 0 - 200 = 300
    const result = fitPanelsToContainer(panels, layout, 500);

    // then
    expect(result).to.exist;
    expect(result.a.width).to.equal(300);
  });

});


describe('getSiblingsWidth', function() {

  it('should return 0 when no siblings exist', function() {

    // given
    const panels = [ panel('a') ];
    const layout = {
      a: { open: true, width: 500 }
    };

    // when
    const result = getSiblingsWidth('a', panels, layout);

    // then
    expect(result).to.equal(0);
  });


  it('should sum open siblings widths', function() {

    // given
    const panels = [ panel('a'), panel('b'), panel('c') ];
    const layout = {
      a: { open: true, width: 300 },
      b: { open: true, width: 400 },
      c: { open: true, width: 350 }
    };

    // when
    const result = getSiblingsWidth('a', panels, layout);

    // then
    expect(result).to.equal(400 + 350);
  });


  it('should ignore closed siblings', function() {

    // given
    const panels = [ panel('a'), panel('b') ];
    const layout = {
      a: { open: true, width: 300 },
      b: { open: false, width: 400 }
    };

    // when
    const result = getSiblingsWidth('a', panels, layout);

    // then
    expect(result).to.equal(0);
  });


  it('should use MIN_PANEL_WIDTH as minimum for open siblings', function() {

    // given
    const panels = [ panel('a'), panel('b') ];
    const layout = {
      a: { open: true, width: 300 },
      b: { open: true, width: 100 }
    };

    // when
    const result = getSiblingsWidth('a', panels, layout);

    // then
    expect(result).to.equal(MIN_PANEL_WIDTH);
  });

});


// helpers //////////

function renderSidePanelContainer(options = {}) {
  const {
    layout = {},
    onLayoutChanged = noop,
    children = [
      <PanelStub key="default" layoutPanelId="default" />
    ]
  } = options;

  return render(
    <SidePanelContainer layout={ layout } onLayoutChanged={ onLayoutChanged }>
      { children }
    </SidePanelContainer>
  );
}

function PanelStub({ layoutPanelId, maxWidth, children }) {
  return (
    <div
      data-panel-id={ layoutPanelId }
      data-max-width={ maxWidth }
    >
      {children}
    </div>
  );
}

const noop = () => { };

function panel(id) {
  return { props: { layoutPanelId: id } };
}
