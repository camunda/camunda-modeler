/**
 * Copyright (c) 2021 Institute of Architecture of Application Systems -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = function(electronApp, menuState) {

  return [
    {
      label: 'Update from QRM repository',
      enabled: function() {

        // only enabled for BPMN diagrams
        return menuState.bpmn;
      },
      action: function() {
        electronApp.emit('menu:action', 'updateFromQRMRepo');
      }
    },
    {
      label: 'Transform QuantME process model',
      enabled: function() {

        // only enabled for BPMN diagrams
        return menuState.bpmn;
      },
      action: function() {
        electronApp.emit('menu:action', 'startReplacementProcess');
      }
    }
  ];
};
