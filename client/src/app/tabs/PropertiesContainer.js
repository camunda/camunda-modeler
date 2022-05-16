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

import ResizableContainer from './ResizableContainer';

import css from './PropertiesContainer.less';

export const MIN_WIDTH = 280;

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
  }

  render() {
    const {
      className,
      forwardedRef,
      layout,
      onLayoutChanged
    } = this.props;

    return (
      <ResizableContainer
        className={ className }
        defaultLayout={ DEFAULT_LAYOUT }
        layout={ layout }
        layoutProp="propertiesPanel"
        minWidth={ MIN_WIDTH }
        onLayoutChanged={ onLayoutChanged }
        position="right"
      >
        <div className={ css.PropertiesContainer } ref={ forwardedRef }></div>
      </ResizableContainer>
    );
  }

}

export default React.forwardRef(
  function PropertiesContainer(props, ref) {
    return <PropertiesContainerWrapped { ...props } forwardedRef={ ref } />;
  }
);
