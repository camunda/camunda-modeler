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
  useEffect,
  useRef,
  useState
} from 'react';

export const MIN_CANVAS_WIDTH = 200;
export const MIN_PANEL_WIDTH = 280;

/**
 * Container that coordinates multiple resizable side panels.
 *
 * Each child must render a `ResizableContainer` and provide a
 * `layoutPanelId` prop that matches its key in the `layout` object.
 *
 * Computes an effective `maxWidth` for each child based on the
 * container width, sibling panel widths, and `MIN_CANVAS_WIDTH`.
 * Injects `maxWidth` and a width-limiting `onLayoutChanged` into
 * each child.
 *
 * @param {Object} props
 * @param {Object} props.layout
 * @param {Function} props.onLayoutChanged
 * @param {React.ReactNode} props.children
 */
export default function SidePanelContainer({
  layout,
  onLayoutChanged,
  children
}) {
  const containerRef = useRef();
  const containerWidth = useParentWidth(containerRef);

  const panels = React.Children.toArray(children);

  /**
   * Get the effective `maxWidth` for a panel
   * based on container width and sibling panels' sizes.
   */
  const getMaxWidth = (panelId) => {
    const siblingsWidth = getSiblingsWidth(panelId, panels, layout);
    return containerWidth - siblingsWidth - MIN_CANVAS_WIDTH;
  };

  // Adjust panel widths when they don't fit
  useEffect(() => {
    if (!containerWidth) return;

    const updates = fitPanelsToContainer(panels, layout, containerWidth);
    if (updates) {
      onLayoutChanged(updates);
    }
  }, [ containerWidth, layout ]);

  return (
    <div ref={ containerRef } style={ { display: 'contents' } }>
      { panels.map((child) => {
        const panelId = child.props.layoutPanelId;
        const maxWidth = getMaxWidth(panelId);

        return React.cloneElement(child, {
          maxWidth,
          onLayoutChanged: (update) => {
            const panel = update[panelId];
            if (panel?.open && maxWidth > 0 && panel?.width > maxWidth) {
              update = { ...update, [panelId]: { ...panel, width: maxWidth } };
            }
            onLayoutChanged(update);
          }
        });
      }) }
    </div>
  );
}

/**
 * Hook that observes an element's parent width via ResizeObserver.
 *
 * @param {React.RefObject} ref
 * @returns {number} width (px)
 */
function useParentWidth(ref) {
  const [ width, setWidth ] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });

    ro.observe(ref.current.parentElement);

    return () => ro.disconnect();
  }, [ ref ]);

  return width;
}

/**
 * Returns layout updates needed to fit all open panels within the
 * available container width. Iteratively reduces panel widths until
 * every panel fits alongside its siblings and the canvas.
 *
 * @param {React.ReactNode[]} panels
 * @param {Object} layout
 * @param {number} containerWidth
 * @returns {Object|null} layout updates, or null if nothing changed
 */
export function fitPanelsToContainer(panels, layout, containerWidth) {
  const adjusted = { ...layout };

  let hasOverflow = true;
  while (hasOverflow) {
    hasOverflow = false;

    for (const child of panels) {
      const panelId = child.props.layoutPanelId;
      const panel = adjusted[panelId];

      if (!panel?.open) continue;

      const siblingsWidth = getSiblingsWidth(panelId, panels, adjusted);
      const availableWidth = containerWidth - siblingsWidth - MIN_CANVAS_WIDTH;

      if (panel.width > availableWidth && availableWidth > 0) {
        adjusted[panelId] = { ...panel, width: availableWidth };
        hasOverflow = true;
      }
    }
  }

  const updates = {};
  for (const child of panels) {
    const panelId = child.props.layoutPanelId;
    if (adjusted[panelId] !== layout[panelId]) {
      updates[panelId] = adjusted[panelId];
    }
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

/**
 * Computes the total width of other open panels.
 *
 * @param {string} panelId
 * @param {React.ReactNode[]} panels
 * @param {Object} layout
 * @returns {number} total width (px)
 */
export function getSiblingsWidth(panelId, panels, layout) {
  let total = 0;

  for (const panel of panels) {
    if (panel.props.layoutPanelId === panelId) continue;

    const panelLayout = layout[panel.props.layoutPanelId];
    if (panelLayout?.open) {
      total += Math.max(panelLayout.width || 0, MIN_PANEL_WIDTH);
    }
  }

  return total;
}
