/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';

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

export const MIN_CANVAS_WIDTH = 200;
export const MIN_CANVAS_HEIGHT = 200;

/**
 * Resizable container that can be dragged to resize or clicked to toggle open/closed.
 *
 * Supports both horizontal (width) and vertical (height) resizing based on the `direction` prop.
 *
 * It reserves at least `MIN_CANVAS_WIDTH`/`MIN_CANVAS_HEIGHT` px for the canvas,
 * even if panel's `maxWidth`/`maxHeight` allows for more.
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

    const effectiveMax = getEffectiveMaxSize(
      ref.current, direction, { maxWidth, minWidth, maxHeight, minHeight }
    );

    return {
      ...context,
      rect,
      effectiveMax
    };
  };

  const onResize = ({ delta }, { rect, effectiveMax }) => {
    const newSize = rect[dimension] + delta;
    const newOpen = newSize > CLOSED_THRESHOLD;

    ref.current.style[dimension] = getEffectiveSize(newSize, minSize, effectiveMax || maxSize) + 'px';
    ref.current.classList.toggle('open', newOpen);
    ref.current.classList.add('resizing');
  };

  const onResizeEnd = ({ delta }, { rect, effectiveMax }) => {
    ref.current.classList.remove('resizing');

    const newSize = rect[dimension] + delta;
    const newOpen = newSize > CLOSED_THRESHOLD;

    onResized({
      [dimension]: newOpen ? getEffectiveSize(newSize, minSize, effectiveMax || maxSize) : size,
      open: newOpen
    });
  };

  const onToggle = () => {
    let newSize = size < minSize ? minSize : size;

    if (!open) {
      const effectiveMax = getEffectiveMaxSize(
        ref.current, direction, { maxWidth, minWidth, maxHeight, minHeight }
      );
      if (effectiveMax) {
        newSize = Math.min(newSize, effectiveMax);
      }
    }

    onResized({
      [dimension]: newSize,
      open: !open
    });
  };

  const shrinkIfNeeded = (element) => {
    const effectiveMax = getEffectiveMaxSize(
      element, direction, { maxWidth, minWidth, maxHeight, minHeight }
    );

    if (effectiveMax && size > effectiveMax) {
      element.style[dimension] = effectiveMax + 'px';
      onResized({ [dimension]: effectiveMax, open: true });
    }
  };

  // When a container opens, calculate its size and notify siblings
  useLayoutEffect(() => {
    if (!open || !ref.current) return;

    const effectiveMax = getEffectiveMaxSize(
      ref.current, direction, { maxWidth, minWidth, maxHeight, minHeight }
    );

    if (effectiveMax && size > effectiveMax) {
      ref.current.style[dimension] = effectiveMax + 'px';
      onResized({ [dimension]: effectiveMax, open: true });
    }

    ref.current.parentElement?.dispatchEvent(
      new CustomEvent('panel-layout-change', { detail: ref.current })
    );
  }, [ open ]);

  // Listen for sibling layout changes and window resizes, shrink if needed
  useEffect(() => {
    if (!ref.current || !open) return;

    const parent = ref.current.parentElement;
    if (!parent) return;

    const element = ref.current;

    const handleLayoutChange = (event) => {
      if (event.detail === element) return;
      shrinkIfNeeded(element);
    };

    const handleWindowResize = () => {
      shrinkIfNeeded(element);
    };

    parent.addEventListener('panel-layout-change', handleLayoutChange);
    window.addEventListener('resize', handleWindowResize);

    return () => {
      parent.removeEventListener('panel-layout-change', handleLayoutChange);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [ open, size, dimension, direction, maxWidth, minWidth, maxHeight, minHeight, onResized ]);

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
 * Calculates the effective maximum size for a container,
 * accounting for sibling `ResizableContainer` elements that are currently open.
 * Reserves `MIN_CANVAS_WIDTH`/`MIN_CANVAS_HEIGHT` for the canvas.
 *
 * @param {HTMLElement} element
 * @param {'left'|'right'|'top'|'bottom'} direction
 * @param {Object} sizes - Size constraints.
 * @param {number|null} sizes.maxWidth
 * @param {number} sizes.minWidth
 * @param {number|null} sizes.maxHeight
 * @param {number} sizes.minHeight
 * @returns {number|null} The effective max, or the static max if no parent is found.
 */
function getEffectiveMaxSize(element, direction, { maxWidth, minWidth, maxHeight, minHeight }) {
  const parent = element?.parentElement;

  const horizontal = isHorizontal(direction);
  const max = horizontal ? maxWidth : maxHeight;
  const min = horizontal ? minWidth : minHeight;
  const minCanvas = horizontal ? MIN_CANVAS_WIDTH : MIN_CANVAS_HEIGHT;

  if (!parent) return max;

  const siblingSize = getOpenSiblingSize(element, horizontal);
  const parentSize = horizontal
    ? parent.getBoundingClientRect().width
    : parent.getBoundingClientRect().height;

  const spaceBasedMax = Math.max(min, parentSize - siblingSize - minCanvas);

  return max ? Math.min(max, spaceBasedMax) : spaceBasedMax;
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

/**
 * Returns the total size (width or height) of open sibling ResizableContainer elements.
 *
 * @param {HTMLElement} element
 * @param {boolean} horizontal
 * @returns {number}
 */
function getOpenSiblingSize(element, horizontal) {
  const parent = element?.parentElement;

  const siblings = Array.from(parent?.children || []).filter(
    child => child !== element &&
    child.classList.contains(css.ResizableContainer) &&
    child.classList.contains('open')
  );

  let total = 0;
  siblings.forEach(child => {
    const rect = child.getBoundingClientRect();
    total += horizontal ? rect.width : rect.height;
  });

  return total;
}
