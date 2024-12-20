/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler';

import addExporterModule from '@bpmn-io/add-exporter';

import completeDirectEditingModule from './features/complete-direct-editing';
import globalClipboardModule from './features/global-clipboard';
import handToolOnSpaceModule from './features/hand-tool-on-space';
import propertiesPanelKeyboardBindingsModule from './features/properties-panel-keyboard-bindings';
import lintingAnnotationsModule from '@camunda/linting/modeler';

import { BpmnJSTracking as bpmnJSTracking } from 'bpmn-js-tracking';

import contextPadTracking from 'bpmn-js-tracking/lib/features/context-pad';
import elementTemplatesTracking from 'bpmn-js-tracking/lib/features/element-templates';
import modelingTracking from 'bpmn-js-tracking/lib/features/modeling';
import popupMenuTracking from 'bpmn-js-tracking/lib/features/popup-menu';
import paletteTracking from 'bpmn-js-tracking/lib/features/palette';

import { BpmnImprovedCanvasModule } from './features/improved-canvas';

import Flags, {
  DISABLE_ADJUST_ORIGIN,
  ENABLE_NEW_CONTEXT_PAD
} from '../../../../util/Flags';

export default class PlatformBpmnModeler extends BpmnModeler {

  constructor(options = {}) {

    let {
      additionalModules = [],
      moddleExtensions = {},
      ...otherOptions
    } = options;

    if (Flags.get(ENABLE_NEW_CONTEXT_PAD, false)) {
      additionalModules = [
        ...additionalModules,
        {
          __depends__: [ BpmnImprovedCanvasModule ],
          resourceLinkingContextPadProvider: [ 'value', null ],
          resourceLinkingRules: [ 'value', null ],
          showComments: [ 'value', null ]
        }
      ];
    }

    super({
      ...otherOptions,
      additionalModules,
      moddleExtensions,
      disableAdjustOrigin: Flags.get(DISABLE_ADJUST_ORIGIN),
      canvas: {
        autoFocus: true
      }
    });
  }
}

const defaultModules = BpmnModeler.prototype._modules;

const extensionModules = [
  addExporterModule,
  completeDirectEditingModule,
  globalClipboardModule,
  handToolOnSpaceModule,
  propertiesPanelKeyboardBindingsModule,
  lintingAnnotationsModule,
  bpmnJSTracking,
  contextPadTracking,
  elementTemplatesTracking,
  modelingTracking,
  popupMenuTracking,
  paletteTracking
];

PlatformBpmnModeler.prototype._modules = [
  ...defaultModules,
  ...extensionModules
];
