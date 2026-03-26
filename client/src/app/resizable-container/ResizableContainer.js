/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useRef } from 'react';

import classNames from 'classnames';

import HandleBarX from '../../../resources/icons/HandleBarX.svg';
import HandleBarY from '../../../resources/icons/HandleBarY.svg';

import * as css from './ResizableContainer.less';

export function isLeft(direction) {
  return direction === 'left';
}

export function isTop(direction) {
  return direction === 'top';
}

export function isHorizontal(direction) {
  return direction === 'right' || direction === 'left';
}

export function isVertical(direction) {
  return direction === 'top' || direction === 'bottom';
}

export function getDimension(direction) {
  if (isHorizontal(direction)) {
    return 'width';
  }

  if (isVertical(direction)) {
    return 'height';
  }
}

export const DEFAULT_MIN_WIDTH = 100;
export const DEFAULT_MIN_HEIGHT = 100;

export const CLOSED_THRESHOLD = 50;

/**
 * Resizable container that can be dragged to resize or clicked to toggle open/closed.
 *
 * Supports both horizontal (width) and vertical (height) resizing based on the `direction` prop.
 *
 * @param {Object} props
 * @param {'left'|'right'|'top'|'bottom'} props.direction
 * @param {boolean} props.open
 * @param {(args: { width?: number, height?: number, open: boolean }) => void} props.onResized
 * @param {string} [props.className='']
 * @param {number} [props.width]
 * @param {number} [props.height]
 * @param {number} [props.minWidth=100]
 * @param {number} [props.minHeight=100]
 * @param {number} [props.maxWidth]
 * @param {number} [props.maxHeight]
 * @param {React.ReactNode} [props.children]
 */
export default function ResizableContainer(props) {
  const {
    className = '',
    direction,
    open,
    onResized
  } = props;

  const {
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight
  } = getSizeProps(props);

  const horizontal = isHorizontal(direction);
  const dimension = horizontal ? 'width' : 'height';
  const size = horizontal ? width : height;
  const minSize = horizontal ? minWidth : minHeight;
  const maxSize = horizontal ? maxWidth : maxHeight;

  const ref = useRef();

  const onResizeStart = (_, context) => {
    let rect = {
      width,
      height
    };

    if (ref.current) {
      rect = ref.current.getBoundingClientRect();
    }

    return {
      ...context,
      rect
    };
  };

  const onResize = ({ delta }, { rect }) => {
    const newSize = rect[dimension] + delta;
    const newOpen = newSize > CLOSED_THRESHOLD;

    ref.current.style[dimension] = getEffectiveSize(newSize, minSize, maxSize) + 'px';
    ref.current.classList.toggle('open', newOpen);
    ref.current.classList.add('resizing');
  };

  const onResizeEnd = ({ delta }, { rect }) => {
    ref.current.classList.remove('resizing');

    const newSize = rect[dimension] + delta;
    const newOpen = newSize > CLOSED_THRESHOLD;

    onResized({
      [dimension]: newOpen ? getEffectiveSize(newSize, minSize, maxSize) : size,
      open: newOpen
    });
  };

  const onToggle = () => {
    const newSize = size < minSize ? minSize : size;

    onResized({
      [dimension]: newSize,
      open: !open
    });
  };

  const onMouseDown = useResize(onResizeStart, onResize, onResizeEnd, onToggle, direction);

  return (
    <div
      className={ classNames(
        css.ResizableContainer,
        { 'open': open },
        className
      ) }
      ref={ ref }
      style={ getCSSFromProps(props) }
    >
      <div
        className={ classNames(
          { 'no-display': !open },
          'children',
        ) }>{props.children}</div>
      <Resizer direction={ direction } onMouseDown={ onMouseDown } />
    </div>
  );
}

function Resizer(props) {
  const {
    direction,
    onMouseDown
  } = props;

  return (
    <div
      className={ classNames('resizer', `resizer-${ direction }`) }
      onMouseDown={ onMouseDown }
      role="separator"
      aria-orientation={ isHorizontal(direction) ? 'horizontal' : 'vertical' }
    >
      {
        isHorizontal(direction)
          ? <HandleBarX tabIndex="0" className="handlebar" />
          : <HandleBarY tabIndex="0" className="handlebar" />
      }
      <div className="resizer-border"></div>
    </div>
  );
}

export function getCSSFromProps(props) {
  const {
    direction,
    open
  } = props;

  const {
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight
  } = getSizeProps(props);

  const horizontal = isHorizontal(direction);
  const dimension = horizontal ? 'width' : 'height';
  const size = horizontal ? width : height;
  const minSize = horizontal ? minWidth : minHeight;
  const maxSize = horizontal ? maxWidth : maxHeight;

  return {
    [dimension]: open ? getEffectiveSize(size, minSize, maxSize) + 'px' : '0px'
  };
}

function useResize(onResizeStart, onResize, onResizeEnd, onToggle, direction) {

  const onMouseDown = (event) => {

    let isClick = true;

    const startEvent = event;

    let context = {};

    context = onResizeStart(event, context) || context;

    const onMouseMove = (event) => {
      isClick = false;

      context = onResize(getDelta(startEvent, event, direction), context) || context;
    };

    const onMouseUp = (event) => {
      if (isClick) {
        onToggle();
      } else {
        onResizeEnd(getDelta(startEvent, event, direction), context);
      }

      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return onMouseDown;
}

function getDelta(startEvent, event, direction) {
  const horizontal = isHorizontal(direction);

  if (horizontal) {
    const sign = isLeft(direction) ? -1 : 1;
    return { delta: sign * (event.clientX - startEvent.clientX) };
  } else {
    const sign = isTop(direction) ? -1 : 1;
    return { delta: sign * (event.clientY - startEvent.clientY) };
  }
}

function getSizeProps(props) {
  const {
    width = 0,
    height = 0,
    minWidth = DEFAULT_MIN_WIDTH,
    minHeight = DEFAULT_MIN_HEIGHT,
    maxWidth,
    maxHeight
  } = props;

  return {
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight
  };
}

/**
 * Get a size value between min and max, collapsing to 0 below `CLOSED_THRESHOLD`.
 *
 * @param {number} size
 * @param {number} min
 * @param {number|null} max
 * @returns {number}
 */
function getEffectiveSize(size, min, max) {
  if (size < CLOSED_THRESHOLD) {
    return 0;
  } else if (size < min) {
    return min;
  } else if (max && size > max) {
    return max;
  }

  return size;
}
