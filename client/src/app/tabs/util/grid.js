/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Shared grid behavior for editors that support grid toggle functionality.
 *
 * This behavior handles:
 * - Initializing grid state on mount
 * - Updating grid state on layout changes
 * - Toggling grid via action
 */
export class GridBehavior {

  /**
   * @param { {
   *   getDiagram: () => any
   * } adapter
   */
  constructor(adapter, defaultVisible = true) {

    /**
     * @private
     */
    this.adapter = adapter;

    /**
     * @private
     */
    this.defaultVisible = defaultVisible;
  }

  /**
   * Initialize grid state based on the given layout
   *
   * @param { any } layout
   */
  update(layout) {

    const grid = this.getGrid();

    // may not be available
    if (!grid) {
      return;
    }

    const gridLayout = layout?.grid || {};

    const visible = gridLayout.visible !== undefined ? gridLayout.visible : this.defaultVisible;

    grid.toggle(visible);
  }

  getGrid() {

    const diagram = this.adapter.getDiagram();

    // may not be initialized, yet
    if (!diagram) {
      return null;
    }

    return diagram.get('grid', false);
  }

  /**
   * Toggle grid layout
   *
   * @param { any } layout
   * @param { (newLayout) => void } onLayoutChanged
   */
  toggleGrid(layout, onLayoutChanged) {

    const gridLayout = layout?.grid || {};

    return onLayoutChanged({
      grid: {
        visible: gridLayout?.visible !== undefined ? !gridLayout.visible : !this.defaultVisible
      }
    });
  }

  hasGrid() {
    return !!this.getGrid();
  }

  /**
   * Check if grid changed, and update if needed.
   *
   * @param { any } [prevLayout]
   * @param { any } [newLayout]
   */
  checkUpdate(prevLayout, newLayout) {
    const changed = prevLayout?.grid?.visible !== newLayout?.grid?.visible;

    if (changed) {
      this.update(newLayout);
    }
  }

}

export function getGridMenuEntries({ grid }) {
  return grid ? [ {
    label: 'Toggle Grid',
    accelerator: 'CommandOrControl+G',
    action: 'toggleGrid'
  } ] : [];
}
