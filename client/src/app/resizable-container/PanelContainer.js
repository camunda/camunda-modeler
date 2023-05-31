/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback } from 'react';

import ResizableContainer from './ResizableContainer';

export const MIN_HEIGHT = 200;
export const MAX_HEIGHT = 400;

export const DEFAULT_OPEN = false;
export const DEFAULT_HEIGHT = 200;

export const DEFAULT_LAYOUT = {
  open: DEFAULT_OPEN,
  width: DEFAULT_HEIGHT
};

export default function PanelContainer(props) {
  const {
    layout,
    onLayoutChanged
  } = props;

  const onResized = useCallback(({ open, height }) => {
    onLayoutChanged({
      panel: {
        ...layout.panel,
        open,
        height
      }
    });
  }, [ onLayoutChanged, layout ]);

  const { panel = DEFAULT_LAYOUT } = layout;

  const {
    open = DEFAULT_OPEN,
    height = DEFAULT_HEIGHT
  } = panel;

  return (
    <ResizableContainer
      direction="top"
      open={ open }
      height={ height }
      minHeight={ MIN_HEIGHT }
      maxHeight={ MAX_HEIGHT }
      onResized={ onResized }
    >
      {props.children}
    </ResizableContainer>
  );
}
