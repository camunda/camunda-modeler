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

import {
  CamundaPlatformPropertiesProviderModule as platformPropertiesProviderModule
} from 'bpmn-js-properties-panel';

import Flags, { DISABLE_ADJUST_ORIGIN } from '../../../../util/Flags';


export default class PlatformBpmnModeler extends BpmnModeler {

  constructor(options = {}) {

    const {
      moddleExtensions,
      ...otherOptions
    } = options;

    super({
      ...otherOptions,
      disableAdjustOrigin: Flags.get(DISABLE_ADJUST_ORIGIN),
      moddleExtensions: {
        ...(moddleExtensions || {})
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

  // TODO(nikku): remove this temporary fix to https://github.com/camunda/camunda-modeler/issues/3303
  platformPropertiesProviderModule
];

PlatformBpmnModeler.prototype._modules = [
  ...defaultModules,
  ...extensionModules
];
