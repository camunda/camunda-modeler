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

import BpmnModeler from 'bpmn-js/lib/Modeler';
import elementTemplates from 'bpmn-js-properties-panel/lib/provider/camunda/element-templates';
import quantMEModule from './modeling';
import quantMEModdleExtension from 'client/resources/quantme/quantum4bpmn.json';
import camundaModdlePackage from 'camunda-bpmn-moddle/resources/camunda';

/**
 * Get the definitions from a xml string representing a BPMN diagram
 *
 * @param xml the xml representing the BPMN diagram
 * @return the definitions from the xml definitions
 */
export async function getDefinitionsFromXml(xml) {
  let bpmnModeler = await createModelerFromXml(xml);
  return bpmnModeler.getDefinitions();
}

/**
 * Create a new modeler object and import the given XML BPMN diagram
 *
 * @param xml the xml representing the BPMN diagram
 * @return the modeler containing the BPMN diagram
 */
export async function createModelerFromXml(xml) {

  // create new modeler with the custom QuantME extensions
  const bpmnModeler = createModeler();

  // import the xml containing the definitions
  function importXmlWrapper(xml) {
    return new Promise((resolve) => {
      bpmnModeler.importXML(xml, (successResponse) => {
        resolve(successResponse);
      });
    });
  }

  await importXmlWrapper(xml);

  return bpmnModeler;
}

/**
 * Create a new modeler object using the QuantME extensions
 *
 * @return {Modeler} the created modeler
 */
export function createModeler() {

  // create new modeler with the custom QuantME extensions
  return new BpmnModeler({
    additionalModules: [
      elementTemplates,
      quantMEModule
    ],
    moddleExtensions: {
      camunda: camundaModdlePackage,
      quantME: quantMEModdleExtension
    }
  });
}

/**
 * Return all QuantumCircuitExecutionTasks from the given list of modeling elements
 *
 * @param modelingElements the list of modeling elements
 * @return the list of contained QuantumCircuitExecutionTasks
 */
export function getQuantumCircuitExecutionTasks(modelingElements) {
  return modelingElements.filter(element => element.$type === 'quantme:QuantumCircuitExecutionTask');
}
