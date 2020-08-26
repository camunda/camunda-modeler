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

import BpmnModeler from 'bpmn-js/lib/Modeler';
import elementTemplates from 'bpmn-js-properties-panel/lib/provider/camunda/element-templates';
import quantMEExtension from '../resources/quantum4bpmn.json';
import quantMEModule from '../quantme';
import { getRootProcess } from './Utilities';

export default class QuantMEMatcher {

  /**
   * Check whether the given task matches the detector of the given QRM
   */
  static async matchesQRM(qrm, task) {
    console.log('Matching QRM %s and task with id %s!', qrm.qrmUrl, task.id);

    // create new modeler with the custom QuantME extensions
    const bpmnModeler = new BpmnModeler({
      additionalModules: [
        elementTemplates,
        quantMEModule
      ],
      moddleExtensions: {
        quantME: quantMEExtension
      }
    });

    // import the detector of the QRM to compare it to the given task
    function importXmlWrapper(xml) {
      return new Promise((resolve) => {
        bpmnModeler.importXML(xml,(successResponse) => {
          resolve(successResponse);
        });
      });
    }
    await importXmlWrapper(qrm.detector);

    // check whether the detector is valid and contains exactly one QuantME task
    let rootProcess = getRootProcess(bpmnModeler.getDefinitions());
    console.log(rootProcess);

    // TODO
    return false;
  }
}
