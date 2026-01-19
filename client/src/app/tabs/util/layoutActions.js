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
 * Get the new layout for toggling grid visibility.
 * Uses === false pattern to properly handle undefined (defaults to false/hidden).
 *
 * @param {Object} layout - The current layout object
 * @returns {Object} New layout with toggled grid visibility
 */
export function getToggledGridLayout(layout) {
  return {
    grid: {
      visible: layout.grid?.visible === false
    }
  };
}

/**
 * Get the new layout for toggling properties panel.
 * Uses === false pattern to properly handle undefined (defaults to true/open).
 *
 * @param {Object} layout - The current layout object
 * @param {Object} defaultLayout - The default properties panel layout (with open and width)
 * @returns {Object} New layout with toggled properties panel state
 */
export function getToggledPropertiesPanelLayout(layout, defaultLayout) {
  const propertiesPanelLayout = layout.propertiesPanel || {};
  
  return {
    propertiesPanel: {
      ...defaultLayout,
      ...propertiesPanelLayout,
      open: propertiesPanelLayout.open === false
    }
  };
}
