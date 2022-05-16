/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import classNames from 'classnames';

import { isFunction } from 'min-dash';

import dragger from '../../util/dom/dragger';

import css from './ResizableContainer.less';

import HandleBar from '../../../resources/icons/HandleBar.svg';

import { throttle } from '../../util';

const DEFAULT_POSITION = 'right';


/**
 * Container that can be resized and toggled.
 *
 * @typedef {object} ResizableContainerProps
 * @prop {object} defaultLayout
 * @prop {object} layout
 * @prop {string} layoutProp
 * @prop {number} [minHeight]
 * @prop {number} [minWidth]
 * @prop {bottom|right} [position]
 * @prop {function} [onLayoutChanged]
 *
 * @extends {PureComponent<ResizableContainerProps>}
 */
export default class ResizableContainer extends PureComponent {
  constructor(props) {
    super(props);

    this.handleContainerResize = throttle(this.handleContainerResize);

    this.containerRef = new React.createRef();
    this.resizeHandlerRef = new React.createRef();

    this.context = {};

    this.state = {
      lastSetWidth: this.getStartWidth(),
      lastSetHeight: this.getStartHeight()
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getStartWidth = () => {
    const {
      defaultLayout = {},
      layout = {},
      layoutProp
    } = this.props;

    const containerLayout = layout[layoutProp] || defaultLayout;

    const width = containerLayout.width || defaultLayout.width;

    return width;
  }

  getStartHeight = () => {
    const {
      defaultLayout = {},
      layout = {},
      layoutProp
    } = this.props;

    const containerLayout = layout[layoutProp] || defaultLayout;

    const height = containerLayout.height || defaultLayout.height;

    return height;
  }

  calculateNewLayout = (options) => {
    const {
      minWidth,
      minHeight,
      position = DEFAULT_POSITION
    } = this.props;

    if (position === 'right') {
      return calculateRightLayout({ ...options, minWidth });
    }

    if (position === 'bottom') {
      return calculateBottomLayout({ ...options, minHeight });
    }
  }

  handleResizeStart = (event) => {
    adjustHandlerDragStyles(
      this.resizeHandlerRef.current,
      { dragging: true }
    );

    const onDragStart = dragger(this.handleContainerResize);

    onDragStart(event);

    const {
      fullHeight,
      fullWidth,
      height,
      open,
      position,
      width
    } = getLayoutFromProps(this.props);

    this.context = {
      fullHeight,
      fullWidth,
      open,
      position,
      startHeight: height,
      startWidth: width
    };
  }

  snapToLeft = () => {
    const {
      layoutProp
    } = this.props;

    const newWidth = getWindowWidth();
    this.containerRef.current.style.width = `${newWidth}px`;

    this.changeLayout({
      [layoutProp]: {
        open: true,
        width: newWidth,
        fullWidth: true
      }
    });
  }

  snapToTop = () => {
    const {
      layoutProp
    } = this.props;

    const newHeight = getWindowHeight();
    this.containerRef.current.style.height = `${newHeight}px`;

    this.changeLayout({
      [layoutProp]: {
        open: true,
        height: newHeight,
        fullHeight: true
      }
    });
  }

  handleResize = () => {
    const {
      position = DEFAULT_POSITION
    } = this.props;

    // snap on
    // a) position <right> => snap to left
    // b) position <bottom> => snap to top
    if (position === 'right') {
      const width = getCurrentWidth(this.containerRef.current);
      width >= getMaxWidth() && this.snapToLeft();
    }

    if (position === 'bottom') {
      const height = getCurrentHeight(this.containerRef.current);
      height >= getMaxHeight() && this.snapToTop();
    }
  }

  setContainerHeight = (options) => {
    const {
      fullHeight,
      height
    } = options;

    this.context = {
      ...this.context,
      height: height === 0 ? this.state.lastSetHeight : height,
      fullHeight
    };

    const styledHeight = open ? `${height}px` : 0;

    if (this.containerRef.current) {
      this.containerRef.current.classList.toggle('open', open);
      this.containerRef.current.style.height = styledHeight;
    }
  }

  setContainerWidth = (options) => {
    const {
      fullWidth,
      width
    } = options;

    this.context = {
      ...this.context,
      width: width === 0 ? this.state.lastSetWidth : width,
      fullWidth
    };

    const styledWidth = open ? `${width}px` : 0;

    if (this.containerRef.current) {
      this.containerRef.current.classList.toggle('open', open);
      this.containerRef.current.style.width = styledWidth;
    }
  }

  handleContainerResize = (_, delta) => {
    const { x: dx, y: dy } = delta;

    if (dx === 0 && dy === 0) {
      return;
    }

    const {
      position,
      startWidth,
      startHeight
    } = this.context;

    const {
      open,
      height,
      width,
      fullHeight,
      fullWidth
    } = this.calculateNewLayout({
      dx,
      dy,
      startWidth,
      startHeight
    });

    this.context = {
      ...this.context,
      open
    };

    if (position === 'right') {
      this.setContainerWidth({ fullWidth, width });
    }

    if (position === 'bottom') {
      this.setContainerHeight({ fullHeight, height });
    }

    if (this.resizeHandlerRef.current) {
      adjustHandlerSnapStyles(this.resizeHandlerRef.current, this.context);
    }
  }

  handleResizeEnd = () => {
    const {
      layoutProp
    } = this.props;

    adjustHandlerDragStyles(
      this.resizeHandlerRef.current,
      { dragging: false }
    );

    const {
      fullWidth,
      fullHeight,
      open,
      position,
      height,
      width
    } = this.context;

    this.context = {};

    if (open) {
      this.setState ({
        ...(position === 'right' && { lastSetWidth: width }),
        ...(position === 'bottom' && { lastSetHeight: height })
      });
    }

    this.changeLayout({
      [layoutProp]: {
        open,
        ...(position === 'right' && { width, fullWidth }),
        ...(position === 'bottom' && { height, fullHeight })
      }
    });
  }

  handleToggle = () => {
    const {
      defaultLayout = {},
      layout = {},
      layoutProp,
      position = DEFAULT_POSITION
    } = this.props;

    const containerLayout = layout[layoutProp] || {};

    this.changeLayout({
      [layoutProp]: {
        ...defaultLayout,
        ...containerLayout,
        open: !containerLayout.open,
        ...(position === 'right' && { width: this.state.lastSetWidth }),
        ...(position === 'bottom' && { height: this.state.lastSetHeight })
      }
    });
  }

  changeLayout = (layout = {}) => {
    const { onLayoutChanged } = this.props;

    if (isFunction(onLayoutChanged)) {
      onLayoutChanged(layout);
    }
  }

  render() {
    const {
      className,
      children,
      position = DEFAULT_POSITION
    } = this.props;

    const {
      open,
      height,
      width,
      fullWidth,
      fullHeight
    } = getLayoutFromProps(this.props);

    const style = {
      ...(position === 'right' && { width }),
      ...(position === 'bottom' && { height })
    };

    return (
      <div
        ref={ this.containerRef }
        className={ classNames(
          css.ResizableContainer,
          className,
          { open },
          `position--${position}`
        ) }
        style={ style }>
        <div
          className="toggle"
          onClick={ this.handleToggle }
          draggable
          onDragStart={ this.handleResizeStart }
          onDragEnd={ this.handleResizeEnd }
        >
          {!open && <HandleBar />}
        </div>

        <div
          ref={ this.resizeHandlerRef }
          className={ classNames(
            'resize-area',
            { 'snapped--right': position === 'right' && !open },
            { 'snapped--left': fullWidth },
            { 'snapped--bottom': position === 'bottom' && !open },
            { 'snapped--top': fullHeight },
          ) }
          draggable
          onDragStart={ this.handleResizeStart }
          onDragEnd={ this.handleResizeEnd }
        >
          <div className="resize-handle" />
        </div>
        { children }
      </div>
    );
  }

}


// helpers //////////

function getLayoutFromProps(props) {
  const {
    defaultLayout = {},
    layout = {},
    layoutProp,
    minHeight,
    minWidth,
    position = DEFAULT_POSITION
  } = props;

  const containerLayout = layout[layoutProp] || defaultLayout;

  const { open } = containerLayout;

  let calculatedLayout = {
    open,
    position
  };

  // todo(pinussilvestrus): support position=(left | top)
  if (position === 'right') {
    calculatedLayout = {
      ...calculatedLayout,
      fullWidth: containerLayout.fullWidth,
      width: open ? (containerLayout.width || minWidth) : 0
    };
  }

  if (position === 'bottom') {
    calculatedLayout = {
      ...calculatedLayout,
      fullHeight: containerLayout.fullHeight,
      height: open ? (containerLayout.height || minHeight) : 0
    };
  }

  return calculatedLayout;
}

function calculateBottomLayout(options) {
  const {
    dy,
    minHeight,
    startHeight
  } = options;

  let height = startHeight - dy;
  const maxHeight = getMaxHeight();

  let open = height > minHeight;
  let fullHeight = height > maxHeight;

  if (!open) {

    // if was already closed and drags 40px
    if (startHeight < minHeight && dy < -40) {

      // snap to min height
      height = minHeight;
      open = true;

    } else {
      height = 0;
    }
  }

  if (fullHeight) {

    // if was already fulled and drags 40px
    if (startHeight > maxHeight && dy > 40) {

      // snap to max height
      height = maxHeight;
      fullHeight = false;

    } else {

      // calculate for status + tab bar
      height = getWindowHeight() - 60;
    }
  }

  return {
    open,
    fullHeight,
    height
  };
}

function calculateRightLayout(options) {
  const {
    dx,
    minWidth,
    startWidth
  } = options;

  let width = startWidth - dx;
  const maxWidth = getMaxWidth();

  let open = width > minWidth;
  let fullWidth = width > maxWidth;

  if (!open) {

    // if was already closed and drags 40px
    if (startWidth < minWidth && dx < -40) {

      // snap to min_width
      width = minWidth;
      open = true;

    } else {
      width = 0;
    }
  }

  if (fullWidth) {

    // if was already fulled and drags 40px
    if (startWidth > maxWidth && dx > 40) {

      // snap to max_width
      width = maxWidth;
      fullWidth = false;

    } else {
      width = getWindowWidth();
    }
  }

  return {
    open,
    fullWidth,
    width
  };
}

function adjustHandlerSnapStyles(handle, context) {
  const {
    fullHeight,
    fullWidth,
    open,
    position,
  } = context;

  handle.classList.remove('snapped-right');
  handle.classList.remove('snapped-left');

  if (!open) {
    handle.classList.add(position === 'right' ? 'snapped-right' : 'snapped-bottom');
  }

  if (fullWidth) {
    handle.classList.add('snapped-left');
  }

  if (fullHeight) {
    handle.classList.add('snapped-top');
  }
}

function adjustHandlerDragStyles(handle, context) {

  Object.keys(context).forEach(state => {

    if (context[state]) {
      handle.classList.add(state);
    } else {
      handle.classList.remove(state);
    }

  });
}

function getWindowWidth() {
  return window.innerWidth;
}

function getWindowHeight() {
  return window.innerHeight;
}

function getMaxWidth() {
  return getWindowWidth() * 0.8;
}

function getMaxHeight() {
  return getWindowHeight() * 0.8;
}

function getCurrentWidth(panel) {
  return panel.getBoundingClientRect().width;
}

function getCurrentHeight(panel) {
  return panel.getBoundingClientRect().height;
}
