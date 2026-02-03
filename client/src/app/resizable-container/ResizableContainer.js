/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useRef } from 'react';

import classNames from 'classnames';

import { ChevronRight, ChevronDown, Maximize } from '@carbon/icons-react';

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
export const COLLAPSED_SIZE = 32;

/**
 * Resizable container.
 */
export default function ResizableContainer(props) {
  const {
    className = '',
    direction,
    open,
    onResized,
    title = 'Resizable Container',
    icon = null,
    showClosedIndicator = false
  } = props;

  const {
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight
  } = getSizeProps(props);

  const ref = useRef();

  const onResizeStart = useCallback((_, context) => {
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
  }, [ width, height, ref.current ]);

  const onResize = useCallback(({ dx, dy }, { rect }) => {
    let newOpen;

    if (isHorizontal(direction)) {
      const newWidth = rect.width + dx;

      newOpen = newWidth > CLOSED_THRESHOLD;

      setCSSWidth(ref.current, getCSSWidth(newWidth, minWidth, maxWidth));
    } else {
      const newHeight = rect.height + dy;

      newOpen = newHeight > CLOSED_THRESHOLD;

      setCSSHeight(ref.current, getCSSHeight(newHeight, minHeight, maxHeight));
    }

    if (newOpen) {
      ref.current.classList.add('open');
    } else {
      ref.current.classList.remove('open');
    }

    ref.current.classList.add('resizing');
  }, [ direction, minWidth, minHeight, maxWidth, maxHeight ]);

  const onResizeEnd = useCallback(({ dx, dy }, { rect }) => {
    ref.current.classList.remove('resizing');

    if (isHorizontal(direction)) {
      const newWidth = rect.width + dx;

      const newOpen = newWidth > CLOSED_THRESHOLD;

      onResized({
        width: newOpen ? newWidth : width,
        open: newOpen
      });
    } else {
      const newHeight = rect.height + dy;

      const newOpen = newHeight > CLOSED_THRESHOLD;

      onResized({
        height: newOpen ? newHeight : height,
        open: newOpen
      });
    }
  }, [ direction, minWidth, minHeight, onResized ]);

  const onToggle = useCallback(() => {
    if (isHorizontal(direction)) {
      onResized({
        width: width < minWidth ? minWidth : width,
        open: !open
      });
    } else {
      onResized({
        height: height < minHeight ? minHeight : height,
        open: !open
      });
    }
  }, [ direction, width, height, open ]);

  const onMouseDown = useResize(onResizeStart, onResize, onResizeEnd, onToggle, direction);

  return (
    <div
      className={ classNames(
        css.ResizableContainer,
        {
          'open': open,
          'horizontal': isHorizontal(direction),
          'vertical': isVertical(direction)
        },
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
      {showClosedIndicator && <ClosedIndicator direction={ direction } open={ open } title={ title } icon={ icon } onToggle={ onToggle } />}
    </div>
  );
}

function ClosedIndicator(props) {
  const {
    direction,
    open,
    title,
    icon,
    onToggle
  } = props;

  return (
    <div
      className={ classNames(
        'closed-indicator',
        {
          'open': open,
          'horizontal': isHorizontal(direction),
          'vertical': isVertical(direction)
        }
      )
      }
      onClick={ onToggle }
      role="button"
      tabIndex={ open ? -1 : 0 }
    >
      { isVertical(direction) 
        ? <ChevronDown width={ 16 } height={ 16 } />
        : <ChevronRight width={ 16 } height={ 16 } />
      }
      <span className="title">{ title }</span>
      { icon && <span className="icon">{ icon }</span> }
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
        // isHorizontal(direction)
        //   ? <HandleBarX tabIndex="0" className="handlebar" />
        //   : <HandleBarY tabIndex="0" className="handlebar" />
      }
      <div className="resizer-border"></div>
    </div>
  );
}

export function getCSSFromProps(props) {
  const {
    direction,
    open,
    resizable = true
  } = props;

  // skip calculation if not resizable
  if (!resizable) {
    return {
      width: props.width,
      height: props.height
    };
  }

  const {
    width,
    height,
    minWidth,
    minHeight,
    maxWidth,
    maxHeight
  } = getSizeProps(props);

  if (isHorizontal(direction)) {
    return {
      width: open ? getCSSWidth(width, minWidth, maxWidth) : `${COLLAPSED_SIZE}px`
    };
  } else if (isVertical(direction)) {
    return {
      height: open ? getCSSHeight(height, minHeight, maxHeight) : `${COLLAPSED_SIZE}px`
    };
  }
}

function getWidth(width, minWidth, maxWidth) {
  if (width < CLOSED_THRESHOLD) {
    return COLLAPSED_SIZE;
  } else if (width < minWidth) {
    return minWidth;
  } else if (maxWidth && width > maxWidth) {
    return maxWidth;
  }

  return width;
}

function getHeight(height, minHeight, maxHeight) {
  if (height < CLOSED_THRESHOLD) {
    return COLLAPSED_SIZE;
  } else if (height < minHeight) {
    return minHeight;
  } else if (maxHeight && height > maxHeight) {
    return maxHeight;
  }

  return height;
}

function getCSSWidth(width, minWidth, maxWidth) {
  return `${ getWidth(width, minWidth, maxWidth) }px`;
}

function getCSSHeight(height, minHeight, maxHeight) {
  return `${ getHeight(height, minHeight, maxHeight) }px`;
}

function setCSSWidth(element, width) {
  element.style.width = width;
}
function setCSSHeight(element, height) {
  element.style.height = height;
}

function useResize(onResizeStart, onResize, onResizeEnd, onToggle, direction) {

  const onMouseDown = useCallback(
    (event) => {

      // https://legacy.reactjs.org/docs/legacy-event-pooling.html
      event.persist();

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
    },
    [ direction, onResize, onResizeEnd, onToggle ]
  );

  return onMouseDown;
}

function getDelta(startEvent, event, direction) {
  const {
    clientX: startClientX,
    clientY: startClientY
  } = startEvent;

  const {
    clientX,
    clientY
  } = event;

  if (isHorizontal(direction)) {
    if (isLeft(direction)) {
      return { dx: startClientX - clientX };
    } else {
      return { dx: clientX - startClientX };
    }
  }

  if (isVertical(direction)) {
    if (isTop(direction)) {
      return { dy: startClientY - clientY };
    } else {
      return { dy: clientY - startClientY };
    }
  }
}

function getSizeProps(props) {
  const {
    width,
    height,
    minWidth = DEFAULT_MIN_WIDTH,
    minHeight = DEFAULT_MIN_HEIGHT,
    maxWidth,
    maxHeight
  } = props;

  return {
    width: getWidthInPixels(width),
    height: getHeightInPixels(height),
    minWidth: getWidthInPixels(minWidth),
    minHeight: getHeightInPixels(minHeight),
    maxWidth: maxWidth ? getWidthInPixels(maxWidth) : null,
    maxHeight: maxHeight ? getHeightInPixels(maxHeight) : null
  };
}

function getHeightInPixels(value) {
  return getInPixels(value, window.innerHeight);
}

function getWidthInPixels(value) {
  return getInPixels(value, window.innerWidth);
}

function getInPixels(value, parentSize) {
  if (typeof value === 'string') {
    return parentSize * (parseInt(value.replace('%', '')) / 100);
  }

  if (typeof value === 'number') {
    return value;
  }

  if (!value) {
    return 0;
  }

  throw new Error('Unsupported ResizableContainer size value: ' + value);
}
