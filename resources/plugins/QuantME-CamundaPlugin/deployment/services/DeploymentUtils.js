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

import { getBindingType } from './BindingUtils';
import { getFlowElementsRecursively } from '../../quantme/Utilities';

/**
 * Get the ServiceTasks of the current workflow that have an attached deployment model to deploy the corresponding service starting from the given root element
 *
 * @param startElement the element to start the search for ServiceTasks for
 * @return the list of ServiceTasks with attached deployment models to deploy the required services
 */
export function getServiceTasksToDeploy(startElement) {
  let csarsToDeploy = [];

  if (startElement === undefined) {
    console.warn('Element to start is undefined!');
    return csarsToDeploy;
  }

  // search for service tasks with assigned deployment model
  let flowElements = getFlowElementsRecursively(startElement);
  for (let i = 0; i < flowElements.length; i++) {
    let flowElement = flowElements[i];

    if (isDeployableServiceTask(flowElement)) {
      console.log('Found deployable service task: ', flowElement);

      // check if CSAR was already added for another service task
      let csarEntry = csarsToDeploy.find(serviceTask => flowElement.deploymentModelUrl === serviceTask.url);
      if (csarEntry !== undefined) {
        console.log('Adding to existing CSAR entry...');
        csarEntry.serviceTaskIds.push(flowElement.id);
      } else {
        csarsToDeploy.push(
          {
            serviceTaskIds: [flowElement.id],
            url: flowElement.deploymentModelUrl,
            type: getBindingType(flowElement),
            csarName: getCSARName(flowElement)
          });
      }
    }
  }

  return csarsToDeploy;
}

/**
 * Get the CSAR name from the deployment model URL
 *
 * @param serviceTask the service task the CSAR belongs to
 * @return {*} the CSAR name
 */
function getCSARName(serviceTask) {
  let url = serviceTask.deploymentModelUrl.split('/?csar')[0];
  let urlSplit = url.split('/');
  return urlSplit[urlSplit.length - 1] + '.csar';
}

/**
 * Check whether the given element in a workflow is a deployable ServiceTask
 *
 * @param element the element to check
 * @return {*|boolean} true if the element is a ServiceTask and has an assigned deployment model, false otherwise
 */
function isDeployableServiceTask(element) {
  return element.$type && element.$type === 'bpmn:ServiceTask' && element.deploymentModelUrl && getBindingType(element) !== undefined;
}
