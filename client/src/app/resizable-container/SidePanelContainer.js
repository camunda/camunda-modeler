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
import { Close, Minimize } from '@carbon/icons-react';
import classNames from 'classnames';

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
    className = '',
    layout,
    onLayoutChanged,
    children,
    title = 'Side Panel',
    icon = null,
    layoutKey = 'sidePanel',
    maxSidePanels = false,
    hideAllPanels = false,
    minWidth,
    maxWidth
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
      className={ classNames(
        css.SidePanelContainer,
        className,
        'side-panel',
        {
          'max-side-panels': maxSidePanels,
        }
      ) }
      direction="left"
      open={ hideAllPanels ? false : (maxSidePanels || open) }
      width={ maxSidePanels ? 'calc((100% - 48px) / 3)' : width }
      minWidth={ minWidth || MIN_WIDTH }
      maxWidth={ maxWidth || MAX_WIDTH }
      onResized={ onResized }
      resizable={ !maxSidePanels }
      title={ title }
      icon={ icon }
    >
      <div className="side-panel-container-header">
        <span className="side-panel-container-header-title">
          { icon }
          { title }
        </span>
        {
          !maxSidePanels && (
            <button onClick={ onMinimize }>
              <Close width={ 18 } height={ 18 } />
            </button>
          )
        }
      </div>
      <div className="side-panel-container-body">
        <div className="side-panel-container-body-inner" ref={ ref }>
          { children }
        </div>
      </div>
    </ResizableContainer>
  );
});
