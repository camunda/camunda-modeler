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

import { getPropertiesToCopy } from '../utilities/Utilities';
import { QUANTME_ATTRIBUTES } from '../Constants';

/**
 * Add attributes of a replaced QuantME task to the replacing workflow fragment to enable its configuration based of the attribute values.
 *
 * @param task the QuantME task containing the attribute values
 * @param inputOutputExtension the input/output element of the root element from the replacement fragment
 * @param bpmnFactory the BPMN factory to create new elements for the diagram
 */
export function addQuantMEInputParameters(task, inputOutputExtension, bpmnFactory) {
  console.log('Adding QuantME attributes to replacing workflow fragment: ', task);

  let propertiesToCopy = getPropertiesToCopy(task);
  for (let name in propertiesToCopy) {

    // skip non QuantME attributes
    if (!QUANTME_ATTRIBUTES.includes(name)) {
      continue;
    }

    // create the input parameter with the QuantME attribute name and the value of the replaced task
    inputOutputExtension.inputParameters.push(
      bpmnFactory.create('camunda:InputParameter', {
        name: name,
        value: propertiesToCopy[name]
      })
    );
  }
  return inputOutputExtension;
}
