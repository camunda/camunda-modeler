/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import CmmnModeler from 'cmmn-js/lib/Modeler';

import diagramOriginModule from 'diagram-js-origin';

import alignToOriginModule from '@bpmn-io/align-to-origin';
import addExporterModule from '@bpmn-io/add-exporter';

import camundaModdlePackage from 'camunda-cmmn-moddle/resources/camunda';

import completeDirectEditingModule from '../../bpmn/modeler/features/complete-direct-editing';
import propertiesPanelModule from 'cmmn-js-properties-panel';
import propertiesProviderModule from 'cmmn-js-properties-panel/lib/provider/camunda';
import propertiesPanelKeyboardBindingsModule from '../../bpmn/modeler/features/properties-panel-keyboard-bindings';

import Flags, { DISABLE_ADJUST_ORIGIN } from '../../../../util/Flags';

import 'cmmn-js-properties-panel/styles/properties.less';

import 'cmmn-js/dist/assets/diagram-js.css';
import 'cmmn-js/dist/assets/cmmn-font/css/cmmn-embedded.css';


export default class CamundaCmmnModeler extends CmmnModeler {

  constructor(options = {}) {

    const {
      moddleExtensions,
      ...otherOptions
    } = options;

    super({
      ...otherOptions,
      moddleExtensions: {
        camunda: camundaModdlePackage,
        ...(moddleExtensions || {})
      }
    });
  }
}

const defaultModules = CmmnModeler.prototype._modules;

const extensionModules = [
  addExporterModule,
  completeDirectEditingModule,
  Flags.get(DISABLE_ADJUST_ORIGIN) ? diagramOriginModule : alignToOriginModule,
  propertiesPanelModule,
  propertiesProviderModule,
  propertiesPanelKeyboardBindingsModule
];

CamundaCmmnModeler.prototype._modules = [
  ...defaultModules,
  ...extensionModules
];
