/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useRef
} from 'react';

import useParentWidth from './useParentWidth';

export const MIN_CANVAS_WIDTH = 200;
export const MIN_PANEL_WIDTH = 280;

const SidePanelContainerContext = createContext(null);

/**
 * Container that coordinates multiple resizable side panels.
 *
 * Wrap each panel in a `SidePanelSlot` to receive
 * computed `maxWidth` and a width-limiting `onLayoutChanged`.
 *
 * @example
 * ```jsx
 * <SidePanelContainer layout={layout} onLayoutChanged={onLayoutChanged}>
 *   <SidePanelSlot panelId="variablesSidePanel">
 *     {({ maxWidth, onLayoutChanged }) => (
 *       <VariablesSidePanel maxWidth={maxWidth} onLayoutChanged={onLayoutChanged} />
 *     )}
 *   </SidePanelSlot>
 * </SidePanelContainer>
 * ```
 *
 * @param {Object} props
 * @param {Object} props.layout
 * @param {Function} props.onLayoutChanged
 * @param {React.ReactNode} props.children
 */
export function SidePanelContainer({
  layout,
  onLayoutChanged,
  children
}) {
  const containerRef = useRef();
  const containerWidth = useParentWidth(containerRef);

  const panelIds = useMemo(() => {
    return React.Children.toArray(children)
      .map(child => child.props.panelId);
  }, [ children ]);

  const getMaxWidth = (panelId) => {
    const siblingsWidth = getSiblingsWidth(panelId, panelIds, layout);
    return Math.max(0, containerWidth - siblingsWidth - MIN_CANVAS_WIDTH);
  };

  const contextValue = useMemo(() => ({
    getMaxWidth,
    onLayoutChanged
  }), [ getMaxWidth, onLayoutChanged ]);

  return (
    <SidePanelContainerContext.Provider value={ contextValue }>
      <div ref={ containerRef } style={ { display: 'contents' } }>
        { children }
      </div>
    </SidePanelContainerContext.Provider>
  );
}

/**
 * Wrapper that provides a panel with computed `maxWidth`
 * and `onLayoutChanged` to its render-prop child.
 *
 * @example
 * ```jsx
 * <SidePanelSlot panelId="variablesSidePanel">
 *   {({ maxWidth, onLayoutChanged }) => (
 *     <VariablesSidePanel maxWidth={maxWidth} onLayoutChanged={onLayoutChanged} ... />
 *   )}
 * </SidePanelSlot>
 * ```
 *
 * @param {Object} props
 * @param {string} props.panelId layout key for this panel
 * @param {Function} props.children render-prop receiving { maxWidth, onLayoutChanged }
 */
export function SidePanelSlot({ panelId, children }) {
  const {
    getMaxWidth,
    onLayoutChanged: ctxOnLayoutChanged
  } = useContext(SidePanelContainerContext);

  const maxWidth = getMaxWidth(panelId);

  const onLayoutChanged = (update) => {
    const panel = update[panelId];
    if (panel?.open && maxWidth > 0 && panel?.width > maxWidth) {
      update = { ...update, [panelId]: { ...panel, width: maxWidth } };
    }
    ctxOnLayoutChanged(update);
  };

  return children({ maxWidth, onLayoutChanged });
}

/**
 * Computes the total width of other open panels.
 *
 * @param {string} panelId
 * @param {string[]} panelIds
 * @param {Object} layout
 * @returns {number} total width (px)
 */
export function getSiblingsWidth(panelId, panelIds, layout) {
  let total = 0;

  for (const id of panelIds) {
    if (id === panelId) continue;

    const panelLayout = layout[id];
    if (panelLayout?.open) {
      total += Math.max(panelLayout.width || 0, MIN_PANEL_WIDTH);
    }
  }

  return total;
}
