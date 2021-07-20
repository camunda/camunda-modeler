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

import { getRootProcess } from 'client/src/app/quantme/utilities/Utilities';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import elementTemplates from 'bpmn-js-properties-panel/lib/provider/camunda/element-templates';
import quantMEModule from './modeling';
import quantMEModdleExtension from 'client/resources/quantme/quantum4bpmn.json';
import camundaModdlePackage from 'camunda-bpmn-moddle/resources/camunda';

/**
 * Get the root process from a xml string representing a BPMN diagram
 *
 * @param xml the xml representing the BPMN diagram
 * @return the root process from the xml definitions
 */
export async function getRootProcessFromXml(xml) {
  let bpmnModeler = await createModelerFromXml(xml);

  // extract and return root process
  return getRootProcess(bpmnModeler.getDefinitions());
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
