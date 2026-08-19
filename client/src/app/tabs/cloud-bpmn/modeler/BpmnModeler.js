/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import BpmnModeler from 'camunda-bpmn-js/lib/camunda-cloud/Modeler';

import addExporterModule from '@bpmn-io/add-exporter';

import completeDirectEditingModule from '../../bpmn/modeler/features/complete-direct-editing';
import globalClipboardModule from './features/global-clipboard';
import handToolOnSpaceModule from '../../bpmn/modeler/features/hand-tool-on-space';
import propertiesPanelKeyboardBindingsModule from '../../bpmn/modeler/features/properties-panel-keyboard-bindings';
import lintingAnnotationsModule from '@camunda/linting/modeler';
import { agentConfigAutofillModule } from '@camunda/linting-autofix';

import { BpmnJSTracking as bpmnJSTracking } from 'bpmn-js-tracking';

import contextPadTracking from 'bpmn-js-tracking/lib/features/context-pad';
import elementTemplates from 'bpmn-js-tracking/lib/features/element-templates';
import feelPopupTracking from 'bpmn-js-tracking/lib/features/feel-popup';
import modelingTracking from 'bpmn-js-tracking/lib/features/modeling';
import popupMenuTracking from 'bpmn-js-tracking/lib/features/popup-menu';
import paletteTracking from 'bpmn-js-tracking/lib/features/palette';

import { BpmnImprovedCanvasModule } from '../../bpmn/modeler/features/improved-canvas';

import Flags, {
  DISABLE_ADJUST_ORIGIN,
  DISABLE_AGENT_CONFIG_AUTOFIX,
} from '../../../../util/Flags';

import { utmTag } from '../../../../util/utmTag';

/**
 * Where the agent config autofix affordances link for `fromAi()` guidance.
 * Passed to the shared module rather than hard-coded in it, since Desktop and
 * Web Modeler tag and version their documentation links differently.
 */
const FROM_AI_DOCUMENTATION_URL = utmTag(
  'https://docs.camunda.io/docs/components/connectors/out-of-the-box-connectors/agentic-ai-aiagent-tool-definitions/#ai-generated-parameters-via-fromai'
);

export default class CloudBpmnModeler extends BpmnModeler {

  constructor(options = {}) {

    let {
      additionalModules = [],
      moddleExtensions = {},
      settings,
      ...otherOptions
    } = options;

    if (settings.get('app.newContextPad')) {
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

    if (!Flags.get(DISABLE_AGENT_CONFIG_AUTOFIX)) {
      additionalModules = [ ...additionalModules, agentConfigAutofillModule ];
    }

    super({
      ...otherOptions,
      additionalModules,
      moddleExtensions,
      disableAdjustOrigin: Flags.get(DISABLE_ADJUST_ORIGIN),
      canvas: {
        autoFocus: true
      },
      lintingAutofix: {
        fromAiDocumentationUrl: FROM_AI_DOCUMENTATION_URL
      }
    });
  }
}

const defaultModules = BpmnModeler.prototype._modules;

CloudBpmnModeler.prototype._modules = [
  ...defaultModules,
  addExporterModule,
  completeDirectEditingModule,
  globalClipboardModule,
  handToolOnSpaceModule,
  propertiesPanelKeyboardBindingsModule,
  lintingAnnotationsModule,
  bpmnJSTracking,
  contextPadTracking,
  elementTemplates,
  feelPopupTracking,
  modelingTracking,
  popupMenuTracking,
  paletteTracking
];
