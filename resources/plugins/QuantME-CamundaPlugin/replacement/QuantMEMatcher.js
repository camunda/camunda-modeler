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
import quantMEExtension from '../resources/quantum4bpmn.json';
import quantMEModule from '../quantme';

export default class QuantMEMatcher {

  /**
   * Check whether the given task matches the detector of the given QRM
   */
  static matchesQRM(qrm, task) {
    console.log('Matching QRM %s and task with id %s!', qrm.qrmUrl, task.id);

    // import the detector of the QRM to compare it to the given task
    const bpmnModeler = new BpmnModeler({
      additionalModules: [
        quantMEModule
      ],
      moddleExtensions: {
        quantME: quantMEExtension
      }
    });
    bpmnModeler.importXML(qrm.detector, (err) => {
      if (err) {
        console.error(err);
      }
      console.log('Loaded...');

      console.log(bpmnModeler.getDefinitions());
    });

    console.log(bpmnModeler.getDefinitions());

    // TODO
    return false;
  }
}
