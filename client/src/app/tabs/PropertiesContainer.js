import React, { Component } from 'react';

import classNames from 'classnames';

import dragger from '../../util/dom/dragger';

import css from './PropertiesContainer.less';


const DEFAULT_LAYOUT = {
  open: false,
  width: 250
};


/**
 * A generic container to hold our editors properties panels.
 *
 * Adds resize and toggle support.
 */
class PropertiesContainerWrapped extends Component {

  changeLayout = (newLayout) => {

    const {
      onLayoutChanged
    } = this.props;

    if (typeof onLayoutChanged === 'function') {
      onLayoutChanged(newLayout);
    }
  }

  /**
   * Toggle properties panel expanded state.
   */
  handleToggle = () => {

    const {
      layout
    } = this.props;

    const {
      width,
      open
    } = layout && layout.propertiesPanel || DEFAULT_LAYOUT;

    this.changeLayout({
      propertiesPanel: {
        open: !open,
        width
      }
    });
  }

  /**
   * Returns dragger with cached properties panel width.
   */
  handleResize = (originalWidth) => {

    return dragger((event, delta) => {
      const {
        x
      } = delta;

      const newWidth = originalWidth - x;

      const open = newWidth > 25;

      const width = (open ? newWidth : DEFAULT_LAYOUT.width);

      this.changeLayout({
        propertiesPanel: {
          open,
          width
        }
      });
    });
  }

  render() {

    const {
      layout,
      forwardedRef,
      className,
      hideIfCollapsed
    } = this.props;

    const propertiesPanel = layout.propertiesPanel || DEFAULT_LAYOUT;

    const open = propertiesPanel.open || propertiesPanel.width === 0;
    const width = open ? propertiesPanel.width : 0;

    const propertiesStyle = {
      width
    };

    return (
      <div
        className={ classNames(
          css.PropertiesContainer,
          className,
          { open }
        ) }
        style={ propertiesStyle }>
        {
          (open || !hideIfCollapsed) &&
            <div
              className="toggle"
              onClick={ this.handleToggle }
              draggable
              onDragStart={ this.handleResize(width) }
            >Properties Panel</div>
        }
        {
          (open) &&
            <div
              className="resize-handle"
              draggable
              onDragStart={ this.handleResize(width) }
            ></div>
        }
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