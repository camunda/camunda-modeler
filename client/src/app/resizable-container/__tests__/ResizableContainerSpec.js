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

import { render, fireEvent, screen } from '@testing-library/react';

import ResizableContainer, {
  CLOSED_THRESHOLD,
  MIN_CANVAS_WIDTH,
  getCSSFromProps,
} from '../ResizableContainer';

const {
  spy,
} = sinon;


describe('<ResizableContainer>', function() {

  it('should render with children', function() {

    // when
    createResizableContainer({
      children: <h1>Hello, ResizableContainer</h1>
    });

    // then
    expect(screen.getByText('Hello, ResizableContainer')).to.exist;
  });

  describe('resize', function() {

    describe('horizontal', function() {

      it('should resize left', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'left',
          width: 300,
          open: true,
          onResized
        });

        // when
        resize(-100, 0);

        // then
        expect(onResized).to.have.been.calledWithMatch({
          width: 400,
          open: true
        });
      });


      it('should resize right', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'left',
          width: 300,
          open: true,
          onResized
        });

        // when
        resize(100, 0);

        // then
        expect(onResized).to.have.been.calledWithMatch({
          width: 200,
          open: true
        });
      });


      it('should close when below threshold', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'left',
          width: 300,
          open: true,
          onResized
        });

        // when
        resize(300 - CLOSED_THRESHOLD, 0);

        // then
        expect(onResized).to.have.been.calledWithMatch({
          open: false
        });
      });
    });

    describe('vertical', function() {

      it('should resize up', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'top',
          height: 300,
          open: true,
          onResized
        });

        // when
        resize(0, -100);

        // then
        expect(onResized).to.have.been.calledWithMatch({
          height: 400,
          open: true
        });
      });


      it('should resize down', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'top',
          height: 300,
          open: true,
          onResized
        });

        // when
        resize(0, 100);

        // then
        expect(onResized).to.have.been.calledWithMatch({
          height: 200,
          open: true
        });
      });


      it('should close when below threshold', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'top',
          height: 300,
          open: true,
          onResized
        });

        // when
        resize(0, 300 - CLOSED_THRESHOLD);

        // then
        expect(onResized).to.have.been.calledWithMatch({
          open: false
        });
      });
    });
  });

  describe('toggle', function() {

    describe('horizontal', function() {

      it('should toggle open', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'left',
          width: 300,
          open: false,
          onResized
        });

        // when
        toggle();

        // then
        expect(onResized).to.have.been.calledWithMatch({
          width: 300,
          open: true
        });
      });


      it('should toggle closed', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'left',
          width: 300,
          open: true,
          onResized
        });

        // when
        toggle();

        // then
        expect(onResized).to.have.been.calledWithMatch({
          width: 300,
          open: false
        });
      });
    });

    describe('vertical', function() {

      it('should toggle open', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'top',
          height: 300,
          open: false,
          onResized
        });

        // when
        toggle();

        // then
        expect(onResized).to.have.been.calledWithMatch({
          height: 300,
          open: true
        });
      });


      it('should toggle closed', function() {

        // given
        const onResized = spy();

        createResizableContainer({
          direction: 'top',
          height: 300,
          open: true,
          onResized
        });

        // when
        toggle();

        // then
        expect(onResized).to.have.been.calledWithMatch({
          height: 300,
          open: false
        });
      });
    });
  });

  describe('effective max', function() {

    it('should not open to maxWidth if not enough space', function() {

      // given
      const onResized = spy();

      render(
        <div style={ { width: '1000px', height: '1000px' } }>
          <ResizableContainer
            direction="left"
            width={ 600 }
            open={ true }
            onResized={ () => {} }
          />
          <ResizableContainer
            direction="left"
            width={ 600 }
            maxWidth={ 600 }
            open={ false }
            onResized={ onResized }
          />
        </div>
      );

      // when
      const resizers = screen.getAllByRole('separator');
      fireEvent.mouseDown(resizers[1], { clientX: 0, clientY: 0 });
      fireEvent.mouseUp(window, { clientX: 0, clientY: 0 });

      // then
      expect(onResized).to.have.been.calledOnce;

      const { width, open } = onResized.getCall(0).args[0];
      expect(open).to.be.true;
      expect(width).to.eq(MIN_CANVAS_WIDTH);
    });


    it('should not resize beyond effective max', function() {

      // given
      const onResized = spy();

      render(
        <div style={ { width: '1000px', height: '1000px' } }>
          <ResizableContainer
            direction="right"
            width={ 600 }
            open={ true }
            onResized={ () => {} }
          />
          <ResizableContainer
            direction="left"
            width={ 100 }
            maxWidth={ 600 }
            open={ true }
            onResized={ onResized }
          />
        </div>
      );

      // when
      const resizers = screen.getAllByRole('separator');
      fireEvent.mouseDown(resizers[1], { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: -400, clientY: 0 });
      fireEvent.mouseUp(window, { clientX: -400, clientY: 0 });

      // then
      expect(onResized).to.have.been.calledOnce;

      const { width, open } = onResized.getCall(0).args[0];
      expect(open).to.be.true;
      expect(width).to.eq(200);
    });
  });


  describe('#getCSSFromProps', function() {

    it('should return width for horizontal direction', function() {

      // when
      const css = getCSSFromProps({
        direction: 'left',
        width: 300,
        open: true
      });

      // then
      expect(css).to.eql({ width: '300px' });
    });


    it('should return height for vertical direction', function() {

      // when
      const css = getCSSFromProps({
        direction: 'top',
        height: 300,
        open: true
      });

      // then
      expect(css).to.eql({ height: '300px' });
    });


    it('should return 0 if closed', function() {

      // when
      const css = getCSSFromProps({
        direction: 'left',
        width: 300,
        open: false
      });

      // then
      expect(css).to.eql({ width: '0px' });
    });


    it('should return 0 if below closed threshold', function() {

      // when
      const css = getCSSFromProps({
        direction: 'left',
        width: 25,
        open: true
      });

      // then
      expect(css).to.eql({ width: '0px' });
    });


    it('should clamp to minWidth', function() {

      // when
      const css = getCSSFromProps({
        direction: 'left',
        width: 75,
        minWidth: 100,
        open: true
      });

      // then
      expect(css).to.eql({ width: '100px' });
    });


    it('should clamp to maxWidth', function() {

      // when
      const css = getCSSFromProps({
        direction: 'left',
        width: 900,
        maxWidth: 800,
        open: true
      });

      // then
      expect(css).to.eql({ width: '800px' });
    });

  });

});

// helpers //////////
function createResizableContainer(props = {}) {
  const {
    className,
    direction,
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight,
    open,
    onResized,
    children
  } = props;

  return render(
    <div style={ { width: '1000px', height: '1000px' } }>
      <ResizableContainer
        className={ className }
        direction={ direction }
        width={ width }
        height={ height }
        minWidth={ minWidth }
        minHeight={ minHeight }
        maxWidth={ maxWidth }
        maxHeight={ maxHeight }
        open={ open }
        onResized={ onResized }
      >
        { children }
      </ResizableContainer>
    </div>);
}

function resize(x, y) {
  const resizer = screen.getByRole('separator');

  fireEvent.mouseDown(resizer, {
    clientX: 0,
    clientY: 0
  });

  fireEvent.mouseMove(window, {
    clientX: x,
    clientY: y
  });

  fireEvent.mouseUp(window, {
    clientX: x,
    clientY: y
  });
}

function toggle() {
  const resizer = screen.getByRole('separator');

  fireEvent.mouseDown(resizer, {
    clientX: 0,
    clientY: 0
  });

  fireEvent.mouseUp(window, {
    clientX: 0,
    clientY: 0
  });
}
