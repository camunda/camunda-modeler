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

import ResizableContainer, {
  CLOSED_THRESHOLD,
  getCSSFromProps,
  getDimension,
  isHorizontal,
  isVertical
} from '../ResizableContainer';

import { mount } from 'enzyme';

const {
  spy,
  stub
} = sinon;


describe('<ResizableContainer>', function() {

  it('should render', function() {

    // given
    const { wrapper } = createResizableContainer();

    // then
    expect(wrapper).to.exist;
  });


  [
    'top',
    'left'
  ].forEach(direction => {

    const dimension = getDimension(direction),
          minDimension = getMinDimension(direction),
          maxDimension = getMaxDimension(direction),
          windowDimension = getWindowDimension(direction);

    describe(`resize ${ direction }`, function() {

      it('should resize', function() {

        // given
        const onResized = spy();

        const { wrapper } = createResizableContainer({
          direction,
          onResized,
          open: true,
          [ dimension ]: 300
        });

        // mock the getBoundingClientRect() method of the DOM node to return a fixed width or height
        // this is necessary because the getBoundingClientRect() method of the DOM node returns 0 for all values
        stub(wrapper.getDOMNode(), 'getBoundingClientRect').returns({
          [ dimension ]: 300
        });

        // when
        wrapper.find('.resizer').simulate('mousedown', {
          clientX: 100,
          clientY: 100
        });

        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 0,
          clientY: 0
        }));

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 0,
          clientY: 0
        }));

        // then
        expect(onResized).to.have.been.calledWith({
          open: true,
          [ dimension ]: 400
        });
      });


      it(`should resize and close when ${ dimension } < ${ CLOSED_THRESHOLD }px`, function() {

        // given
        const onResized = spy();

        const { wrapper } = createResizableContainer({
          direction,
          onResized,
          open: true,
          [ dimension ]: 300
        });

        // mock the getBoundingClientRect() method of the DOM node to return a fixed width or height
        // this is necessary because the getBoundingClientRect() method of the DOM node returns 0 for all values
        stub(wrapper.getDOMNode(), 'getBoundingClientRect').returns({
          [ dimension ]: 300
        });

        // when
        wrapper.find('.resizer').simulate('mousedown', {
          clientX: 0,
          clientY: 0
        });

        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: 275,
          clientY: 275
        }));

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 275,
          clientY: 275
        }));

        // then
        expect(onResized).to.have.been.calledWith({
          open: false,
          [ dimension ]: 300
        });
      });

    });


    describe(`toggle ${ direction }`, function() {

      it('should toggle open', function() {

        // given
        const onResized = spy();

        const { wrapper } = createResizableContainer({
          direction,
          onResized,
          open: false,
          [ dimension ]: 300
        });

        // when
        wrapper.find('.resizer').simulate('mousedown', {
          clientX: 100,
          clientY: 100
        });

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 100,
          clientY: 100
        }));

        // then
        expect(onResized).to.have.been.calledWith({
          open: true,
          [ dimension ]: 300
        });
      });


      it('should toggle closed', function() {

        // given
        const onResized = spy();

        const { wrapper } = createResizableContainer({
          direction,
          onResized,
          open: true,
          [ dimension ]: 300
        });

        // when
        wrapper.find('.resizer').simulate('mousedown', {
          clientX: 100,
          clientY: 100
        });

        window.dispatchEvent(new MouseEvent('mouseup', {
          clientX: 100,
          clientY: 100
        }));

        // then
        expect(onResized).to.have.been.calledWith({
          open: false,
          [ dimension ]: 300
        });
      });

    });


    describe('#getCSSFromProps', function() {

      it(`should get ${ dimension }`, function() {

        // when
        const css = getCSSFromProps({
          direction,
          [ dimension ]: 300,
          open: true
        });

        // then
        expect(css).to.eql({
          [ dimension ]: '300px'
        });
      });


      it(`should get ${ dimension } = 0 if closed`, function() {

        // when
        const css = getCSSFromProps({
          direction,
          [ dimension ]: 300,
          open: false
        });

        // then
        expect(css).to.eql({
          [ dimension ]: '0px'
        });
      });


      it(`should get ${ dimension } = 0 if ${ dimension } < ${ CLOSED_THRESHOLD }`, function() {

        // when
        const css = getCSSFromProps({
          direction,
          [ dimension ]: 25,
          open: true
        });

        // then
        expect(css).to.eql({
          [ dimension ]: '0px'
        });
      });


      it(`should get ${ dimension } = ${ minDimension } if ${ CLOSED_THRESHOLD } < ${ dimension } < ${ minDimension }`, function() {

        // when
        const css = getCSSFromProps({
          direction,
          [ dimension ]: 75,
          open: true
        });

        // then
        expect(css).to.eql({
          [ dimension ]: '100px'
        });
      });


      it(`should get ${ dimension } = ${ maxDimension } if ${ dimension } > ${ maxDimension }`, function() {

        // when
        const css = getCSSFromProps({
          direction,
          [ dimension ]: window[ windowDimension ] - 50,
          [ maxDimension ]: window[ windowDimension ] - 100,
          open: true
        });

        // then
        expect(css).to.eql({
          [ dimension ]: (window[ windowDimension ] - 100) + 'px'
        });
      });

    });

  });

});

// helpers //////////
function createResizableContainer(props = {}, mountFn = mount) {
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
    children = null
  } = props;

  const wrapper = mountFn(
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
    </ResizableContainer>);

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}

function getMinDimension(direction) {
  if (isHorizontal(direction)) {
    return 'minWidth';
  } else if (isVertical(direction)) {
    return 'minHeight';
  }
}

function getMaxDimension(direction) {
  if (isHorizontal(direction)) {
    return 'maxWidth';
  } else if (isVertical(direction)) {
    return 'maxHeight';
  }
}

function getWindowDimension(direction) {
  if (isHorizontal(direction)) {
    return 'innerWidth';
  } else if (isVertical(direction)) {
    return 'innerHeight';
  }
}
