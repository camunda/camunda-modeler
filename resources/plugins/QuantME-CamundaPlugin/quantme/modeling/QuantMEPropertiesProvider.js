/**
 * Copyright (c) 2020 Institute for the Architecture of Application System -
 * University of Stuttgart
 *
 * This program and the accompanying materials are made available under the
 * terms the Apache Software License 2.0
 * which is available at https://www.apache.org/licenses/LICENSE-2.0.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import PropertiesActivator from 'bpmn-js-properties-panel/lib/PropertiesActivator';
import CamundaPropertiesProvider from 'bpmn-js-properties-panel/lib/provider/camunda/CamundaPropertiesProvider';
import * as consts from '../Constants';

let QuantMEPropertyEntryHandler = require('./QuantMEPropertyEntryHandler');

/**
 * This class extends the default PropertiesActivator with the properties of the newly introduced QuantME task types
 */
export default class QuantMEPropertiesProvider extends PropertiesActivator {
  constructor(eventBus, canvas, bpmnFactory, elementRegistry, elementTemplates, translate) {
    super(eventBus);
    this.camundaPropertiesProvider = new CamundaPropertiesProvider(eventBus, canvas, bpmnFactory, elementRegistry, elementTemplates, translate);
    this.translate = translate;
  }

  getTabs(element) {
    var tabs = this.camundaPropertiesProvider.getTabs(element);

    // add properties of QuantME tasks to panel
    if (element.type && element.type.startsWith('quantme:')) {

      // search for general tab in properties to add QuantME properties
      var generalTab, generalTabIndex;
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].id === 'general') {
          generalTab = tabs[i];
          generalTabIndex = i;
          break;
        }
      }

      if (generalTab == null) {
        console.log('Unable to find \'general\' tab for element: ', element);
        return tabs;
      }

      // add required properties to general tab
      var quantMEGroup = {
        id: 'quantme',
        label: this.translate('QuantME Properties'),
        entries: []
      };
      addQuantMEEntries(quantMEGroup, element, this.translate);
      generalTab.groups.push(quantMEGroup);
      tabs[generalTabIndex] = generalTab;
    }
    return tabs;
  }
}

/**
 * Add the property entries for the QuantME attributes to the given group
 *
 * @param group the group to add the entries to
 * @param element the QuantME element
 * @param translate utility to translate
 */
function addQuantMEEntries(group, element, translate) {
  switch (element.type) {
  case consts.QUANTUM_COMPUTATION_TASK:
    addQuantumComputationTaskEntries(group, translate);
    break;
  case consts.QUANTUM_CIRCUIT_LOADING_TASK:
    addQuantumCircuitLoadingTaskEntries(group, translate);
    break;
  case consts.DATA_PREPARATION_TASK:
    addDataPreparationTaskEntries(group, translate);
    break;
  case consts.ORACLE_EXPANSION_TASK:
    addOracleExpansionTaskEntries(group, translate);
    break;
  case consts.QUANTUM_CIRCUIT_EXECUTION_TASK:
    addQuantumCircuitExecutionTaskEntries(group, translate);
    break;
  case consts.READOUT_ERROR_MITIGATION_TASK:
    addReadoutErrorMitigationTaskEntries(group, translate);
    break;
  default:
    console.log('Unsupported QuantME element of type: ', element.type);
  }
}

function addQuantumComputationTaskEntries(group, translate) {

  // add algorithm and provider attributes
  QuantMEPropertyEntryHandler.addAlgorithmEntry(group, translate);
  QuantMEPropertyEntryHandler.addProviderEntry(group, translate);
}

function addQuantumCircuitLoadingTaskEntries(group, translate) {

  // add quantumCircuit and url attributes
  QuantMEPropertyEntryHandler.addQuantumCircuitEntry(group, translate);
  QuantMEPropertyEntryHandler.addUrlEntry(group, translate);
}

function addDataPreparationTaskEntries(group, translate) {

  // add encodingSchema and programmingLanguage attributes
  QuantMEPropertyEntryHandler.addEncodingSchemaEntry(group, translate);
  QuantMEPropertyEntryHandler.addProgrammingLanguageEntry(group, translate);
}

function addOracleExpansionTaskEntries(group, translate) {

  // add oracleId, oracleCircuit, oracleFunction and programmingLanguage attributes
  QuantMEPropertyEntryHandler.addOracleIdEntry(group, translate);
  QuantMEPropertyEntryHandler.addOracleCircuitEntry(group, translate);
  QuantMEPropertyEntryHandler.addOracleURLEntry(group, translate);
  QuantMEPropertyEntryHandler.addProgrammingLanguageEntry(group, translate);
}

function addQuantumCircuitExecutionTaskEntries(group, translate) {

  // add provider, qpu, shots and programmingLanguage attributes
  QuantMEPropertyEntryHandler.addProviderEntry(group, translate);
  QuantMEPropertyEntryHandler.addQpuEntry(group, translate);
  QuantMEPropertyEntryHandler.addShotsEntry(group, translate);
  QuantMEPropertyEntryHandler.addProgrammingLanguageEntry(group, translate);
}

function addReadoutErrorMitigationTaskEntries(group, translate) {

  // add unfoldingTechnique, qpu, and maxAge attributes
  QuantMEPropertyEntryHandler.addUnfoldingTechniqueEntry(group, translate);
  QuantMEPropertyEntryHandler.addQpuEntry(group, translate);
  QuantMEPropertyEntryHandler.addMaxAgeEntry(group, translate);
}

QuantMEPropertiesProvider.$inject = [
  'eventBus',
  'canvas',
  'bpmnFactory',
  'elementRegistry',
  'elementTemplates',
  'translate'
];
