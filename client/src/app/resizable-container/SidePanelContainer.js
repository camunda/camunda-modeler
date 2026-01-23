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

import * as css from './SidePanelContainer.less';
import { Minimize } from '@carbon/icons-react';

export const MIN_WIDTH = 280;
export const MAX_WIDTH = MIN_WIDTH * 3;

export const DEFAULT_OPEN = true;
export const DEFAULT_WIDTH = 150;

export const DEFAULT_LAYOUT = {
  open: DEFAULT_OPEN,
  width: DEFAULT_WIDTH
};

export default forwardRef(function SidePanelContainer(props, ref) {
  const {
    layout,
    onLayoutChanged,
    children,
    title = 'Side Panel',
    layoutKey = 'sidePanel',
  } = props;

  const onResized = useCallback(({ open, width }) => {
    onLayoutChanged({
      [layoutKey]: {
        ...layout[layoutKey],
        open,
        width
      }
    });
  }, [ onLayoutChanged, layout ]);

  const onMinimize = useCallback(() => {
    onLayoutChanged({
      [layoutKey]: {
        ...layout[layoutKey],
        open: false
      }
    });
  }, [ onLayoutChanged, layout, layoutKey ]);

  const sidePanelLayout = layout?. [layoutKey] || {};

  const {
    open = DEFAULT_OPEN,
    width = DEFAULT_WIDTH
  } = sidePanelLayout;

  return (
    <ResizableContainer
      className={ `${css.SidePanelContainer} side-panel` }
      direction="left"
      open={ open }
      width={ width }
      minWidth={ MIN_WIDTH }
      maxWidth={ MAX_WIDTH }
      onResized={ onResized }
      title={ title }
    >
      <div className="side-panel-container-header">
        <span>
          { title }
        </span>
        <button onClick={ onMinimize }>
          <Minimize width={ 16 } height={ 16 } />
        </button>
      </div>
      <div className="side-panel-container-body">
        <div className="side-panel-container-body-inner" ref={ ref }>
          { children }
        </div>
      </div>
    </ResizableContainer>
  );
});
