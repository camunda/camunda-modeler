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
 * modeConfig — single source of truth for per-mode behavior in the left-rail
 * prototype. Each mode defines:
 *   - label:                human-visible name
 *   - hotkey:               rail chip hint (Cmd/Ctrl+<key>)
 *   - themeClass:           LESS root class applied on BpmnEditor (colors rail band, chrome)
 *   - sidePanelTab:         which side-panel tab a mode switch auto-opens (null = keep current)
 *   - sidePanelOpen:        whether mode switch forces the side panel open
 *   - visibleShapes:        shape IDs the rail renders; empty = rail shapes section collapsed
 *   - visiblePropertyGroups:data-group-id prefixes that remain visible; [] = show all (no filter)
 *   - canvasChip:           inline chip shown near the canvas (e.g. Test mode hint), null = none
 *   - canvasOverlay:        full overlay (e.g. Simulate placeholder), null = none
 *
 * The shapes list uses stable keys; RailShapesSection maps these to bpmn-js
 * element factories.
 */

export const MODES = [ 'design', 'implement', 'simulate', 'test' ];

export const DESIGN_SHAPES = [
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:Task',
  'bpmn:ExclusiveGateway',
  'bpmn:ParallelGateway',
  'bpmn:SubProcess',
  'bpmn:TextAnnotation'
];

export const IMPLEMENT_SHAPES = [
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:Task',
  'bpmn:ServiceTask',
  'bpmn:UserTask',
  'bpmn:ScriptTask',
  'bpmn:BusinessRuleTask',
  'bpmn:CallActivity',
  'bpmn:IntermediateCatchEvent',
  'bpmn:IntermediateThrowEvent',
  'bpmn:ExclusiveGateway',
  'bpmn:ParallelGateway',
  'bpmn:EventBasedGateway',
  'bpmn:SubProcess',
  'bpmn:TextAnnotation'
];

const modeConfig = {
  design: {
    label: 'Design',
    hotkey: '1',
    themeClass: 'bpmn-editor--mode-design',
    sidePanelTab: 'properties',
    sidePanelOpen: false,
    visibleShapes: DESIGN_SHAPES,

    // Only high-level, outcome-oriented property groups.
    // CSS selector hides everything that isn't in this list.
    visiblePropertyGroups: [
      'general',
      'documentation',
      'multiInstance',
      'errors'
    ],

    canvasChip: null,
    canvasOverlay: null
  },

  implement: {
    label: 'Implement',
    hotkey: '2',
    themeClass: 'bpmn-editor--mode-implement',
    sidePanelTab: 'properties',
    sidePanelOpen: true,
    visibleShapes: IMPLEMENT_SHAPES,

    // Empty list = no CSS filter = show every property group.
    visiblePropertyGroups: [],

    canvasChip: null,
    canvasOverlay: null
  },

  simulate: {
    label: 'Simulate',
    hotkey: '3',
    themeClass: 'bpmn-editor--mode-simulate',
    sidePanelTab: null,
    sidePanelOpen: false,
    visibleShapes: [],
    visiblePropertyGroups: [ 'general' ],
    canvasChip: null,
    canvasOverlay: {
      title: 'Token simulation coming soon',
      body: 'You\u2019ll step through tokens here to see exactly how a process executes. Not wired up in this prototype.'
    }
  },

  test: {
    label: 'Test',
    hotkey: '4',
    themeClass: 'bpmn-editor--mode-test',
    sidePanelTab: 'test',
    sidePanelOpen: true,
    visibleShapes: [],

    // Only the properties relevant to running a task test.
    visiblePropertyGroups: [ 'general', 'inputOutput' ],

    canvasChip: {
      label: 'Test mode',
      hint: 'Click a task to run it with inputs.'
    },
    canvasOverlay: null
  }
};

export default modeConfig;

export function getModeConfig(mode) {
  return modeConfig[mode] || modeConfig.design;
}
