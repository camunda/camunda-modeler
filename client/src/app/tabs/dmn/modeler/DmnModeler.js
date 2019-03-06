/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import DmnModeler from 'dmn-js/lib/Modeler';

import diagramOriginModule from 'diagram-js-origin';

import alignToOriginModule from '@bpmn-io/align-to-origin';
import addExporter from '@bpmn-io/add-exporter/add-exporter';

import propertiesPanelModule from 'dmn-js-properties-panel';
import propertiesProviderModule from 'dmn-js-properties-panel/lib/provider/camunda';

import drdAdapterModule from 'dmn-js-properties-panel/lib/adapter/drd';
import decisionTableAdapterModule from 'dmn-js-properties-panel/lib/adapter/decision-table';
import literalExpressionAdapterModule from 'dmn-js-properties-panel/lib/adapter/literal-expression';

import propertiesPanelKeyboardBindingsModule from '../../bpmn/modeler/features/properties-panel-keyboard-bindings';
import decisionTableKeyboardModule from './features/decision-table-keyboard';

import Flags, { DISABLE_ADJUST_ORIGIN } from '../../../../util/Flags';

import camundaModdleDescriptor from 'camunda-dmn-moddle/resources/camunda';

import 'dmn-js/dist/assets/diagram-js.css';
import 'dmn-js/dist/assets/dmn-font/css/dmn-embedded.css';
import 'dmn-js/dist/assets/dmn-js-decision-table-controls.css';
import 'dmn-js/dist/assets/dmn-js-decision-table.css';
import 'dmn-js/dist/assets/dmn-js-drd.css';
import 'dmn-js/dist/assets/dmn-js-literal-expression.css';
import 'dmn-js/dist/assets/dmn-js-shared.css';

import 'dmn-js-properties-panel/dist/assets/dmn-js-properties-panel.css';


export default class CamundaDmnModeler extends DmnModeler {

  constructor(options = {}) {

    const {
      moddleExtensions,
      drd,
      decisionTable,
      literalExpression,
      exporter,
      ...otherOptions
    } = options;

    super({
      ...otherOptions,
      drd: mergeModules(drd, [
        Flags.get(DISABLE_ADJUST_ORIGIN) ? diagramOriginModule : alignToOriginModule,
        propertiesPanelModule,
        propertiesProviderModule,
        drdAdapterModule,
        propertiesPanelKeyboardBindingsModule
      ]),
      decisionTable: mergeModules(decisionTable, [
        propertiesPanelModule,
        propertiesProviderModule,
        decisionTableAdapterModule,
        propertiesPanelKeyboardBindingsModule,
        decisionTableKeyboardModule
      ]),
      literalExpression: mergeModules(literalExpression, [
        propertiesPanelModule,
        propertiesProviderModule,
        literalExpressionAdapterModule,
        propertiesPanelKeyboardBindingsModule
      ]),
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
        ...(moddleExtensions || {})
      }
    });

    this.on('viewer.created', ({ viewer }) => {

      viewer.on('commandStack.changed', event => {
        this._emit('view.contentChanged', event);
      });

      viewer.on('selection.changed', event => {
        this._emit('view.selectionChanged', event);
      });

      viewer.on([ 'directEditing.activate', 'directEditing.deactivate' ], event => {
        this._emit('view.directEditingChanged', event);
      });

      viewer.on('error', ({ error }) => {
        this._emit('error', {
          viewer,
          error
        });
      });

    });

    addExporter(exporter, this);

  }

  /**
   * Get stack index of active viewer.
   *
   * @returns {?number} Stack index or null.
   */
  getStackIdx() {
    const viewer = this.getActiveViewer();

    if (!viewer) {
      return null;
    }

    const commandStack = viewer.get('commandStack', false);

    if (!commandStack) {
      return null;
    }

    return commandStack._stackIdx;
  }
}


// helpers ///////////////////////

function mergeModules(editorConfig = {}, additionalModules) {

  const editorModules = editorConfig.additionalModules || [];

  return {
    ...editorConfig,
    additionalModules: [
      ...editorModules,
      ...additionalModules
    ]
  };
}