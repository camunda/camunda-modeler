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

import css from './PropertiesContainer.less';

import HandleBar from '../../../resources/icons/HandleBar.svg';

import { throttle } from '../../util';

export const MIN_WIDTH = 250;

export const DEFAULT_LAYOUT = {
  open: false,
  width: MIN_WIDTH
};

/**
 * Container for properties panel that can be resized and toggled.
 */
class PropertiesContainerWrapped extends PureComponent {
  constructor(props) {
    super(props);

    this.handlePanelResize = throttle(this.handlePanelResize);

    this.containerRef = new React.createRef();
    this.resizeHandlerRef = new React.createRef();

    this.context = {};

    this.state = {
      lastSetWidth: this.getStartWidth()
    };
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  getStartWidth = () => {
    const layout = this.props.layout || {};

    const propertiesPanel = layout.propertiesPanel || DEFAULT_LAYOUT;

    const width = propertiesPanel.width || DEFAULT_LAYOUT.width;

    return width;
  }

  handleResizeStart = (event) => {
    adjustHandlerDragStyles(
      this.resizeHandlerRef.current,
      { dragging: true }
    );

    const onDragStart = dragger(this.handlePanelResize);

    onDragStart(event);

    const {
      open,
      width,
      fullWidth
    } = getLayoutFromProps(this.props);

    this.context = {
      open,
      startWidth: width,
      fullWidth
    };
  }

  handleResize = () => {
    const width = getCurrentWidth(this.containerRef.current);

    if (width >= getMaxWidth()) {

      const newWidth = getWindowWidth();
      this.containerRef.current.style.width = `${newWidth}px`;

      this.changeLayout({
        propertiesPanel: {
          open: true,
          width: newWidth,
          fullWidth: true
        }
      });
    }
  }

  handlePanelResize = (_, delta) => {
    const { x: dx } = delta;

    if (dx === 0) {
      return;
    }

    const { startWidth } = this.context;

    const {
      open,
      width,
      fullWidth
    } = getLayout(dx, startWidth);

    this.context = {
      ...this.context,
      open,
      width: width === 0 ? this.state.lastSetWidth : width,
      fullWidth
    };

    const styledWidth = open ? `${width}px` : 0;

    if (this.containerRef.current) {
      this.containerRef.current.classList.toggle('open', open);
      this.containerRef.current.style.width = styledWidth;
    }

    if (this.resizeHandlerRef.current) {
      adjustHandlerSnapStyles(this.resizeHandlerRef.current, this.context);
    }
  }

  handleResizeEnd = () => {
    adjustHandlerDragStyles(
      this.resizeHandlerRef.current,
      { dragging: false }
    );

    const {
      open,
      width,
      fullWidth
    } = this.context;

    this.context = {};

    if (open) {
      this.setState ({ lastSetWidth: width });
    }

    this.changeLayout({
      propertiesPanel: {
        open,
        width,
        fullWidth
      }
    });
  }

  handleToggle = () => {
    const { layout = {} } = this.props;

    const { propertiesPanel = {} } = layout;

    this.changeLayout({
      propertiesPanel: {
        ...DEFAULT_LAYOUT,
        ...propertiesPanel,
        open: !propertiesPanel.open,
        width: this.state.lastSetWidth
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
      forwardedRef
    } = this.props;

    const {
      open,
      width,
      fullWidth
    } = getLayoutFromProps(this.props);

    return (
      <div
        ref={ this.containerRef }
        className={ classNames(
          css.PropertiesContainer,
          className,
          { open }
        ) }
        style={ { width } }>
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
            { 'snapped-right': !open },
            { 'snapped-left': fullWidth },
          ) }
          draggable
          onDragStart={ this.handleResizeStart }
          onDragEnd={ this.handleResizeEnd }
        >
          <div className="resize-handle" />
        </div>

        <div className="properties-container" ref={ forwardedRef }></div>
      </div>
    );
  }

}

export default React.forwardRef(
  function PropertiesContainer(props, ref) {
    return <PropertiesContainerWrapped { ...props } forwardedRef={ ref } />;
  }
);

// helpers //////////

function getLayout(dx, initialWidth) {
  let width = initialWidth - dx;
  const max_width = getMaxWidth();

  let open = width > MIN_WIDTH;
  let fullWidth = width > max_width;

  if (!open) {

    // if was already closed and drags 40px
    if (initialWidth < MIN_WIDTH && dx < -40) {

      // snap to min_width
      width = MIN_WIDTH;
      open = true;

    } else {
      width = 0;
    }
  }

  if (fullWidth) {

    // if was already fulled and drags 40px
    if (initialWidth > max_width && dx > 40) {

      // snap to max_width
      width = max_width;
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

function getLayoutFromProps(props) {
  const layout = props.layout || {};

  const propertiesPanel = layout.propertiesPanel || DEFAULT_LAYOUT;

  const { open, fullWidth } = propertiesPanel;

  const width = open ? propertiesPanel.width : 0;

  return {
    open,
    width,
    fullWidth
  };
}

function adjustHandlerSnapStyles(handle, context) {
  const {
    open,
    fullWidth
  } = context;

  handle.classList.remove('snapped-right');
  handle.classList.remove('snapped-left');

  if (!open) {
    handle.classList.add('snapped-right');
  }

  if (fullWidth) {
    handle.classList.add('snapped-left');
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

function getMaxWidth() {
  return getWindowWidth() * 0.8;
}

function getCurrentWidth(panel) {
  return panel.getBoundingClientRect().width;
}