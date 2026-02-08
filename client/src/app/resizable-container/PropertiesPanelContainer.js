/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { forwardRef, useCallback } from 'react';

import ResizableContainer from './ResizableContainer';

import * as css from './PropertiesPanelContainer.less';

export const MIN_WIDTH = 280;
export const MAX_WIDTH = MIN_WIDTH * 3;

export const DEFAULT_OPEN = true;
export const DEFAULT_WIDTH = 280;

export const DEFAULT_LAYOUT = {
  open: DEFAULT_OPEN,
  width: DEFAULT_WIDTH
};

export default forwardRef(function PropertiesPanelContainer(props, ref) {
  const {
    layout,
    onLayoutChanged
  } = props;

  const onResized = useCallback(({ open, width }) => {
    onLayoutChanged({
      sidePanel: {
        ...DEFAULT_LAYOUT,
        ...layout.sidePanel,
        open,
        width
      }
    });
  }, [ onLayoutChanged, layout ]);

  const { sidePanel: propertiesPanel = DEFAULT_LAYOUT } = layout;

  const {
    open = DEFAULT_OPEN,
    width = DEFAULT_WIDTH
  } = propertiesPanel;

  return (
    <ResizableContainer
      className={ `${css.PropertiesPanelContainer} properties` }
      direction="left"
      open={ open }
      width={ width }
      minWidth={ MIN_WIDTH }
      maxWidth={ MAX_WIDTH }
      onResized={ onResized }
    >
      <div className="properties-container" ref={ ref } />
    </ResizableContainer>
  );
});
