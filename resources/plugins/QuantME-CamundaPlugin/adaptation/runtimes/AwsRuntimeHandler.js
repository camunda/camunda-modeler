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

import { fetch } from 'whatwg-fetch';
import {
  getQuantumCircuitExecutionTasks,
  getRootProcess,
  performAjax
} from 'client/src/app/quantme/utilities/Utilities';
import { createModelerFromXml } from '../../quantme/Utilities';
import { startReplacementProcess } from '../../quantme/replacement/QuantMETransformator';
import {
  createNewArtifactTemplate, createNewServiceTemplateVersion
} from 'client/src/app/quantme/deployment/OpenTOSCAUtils';
import {
  getInvalidModelingConstruct,
  getRequiredPrograms,
  getTaskOrder
} from './RuntimeHandlerUtils';

/**
 * Generate a AWS Runtime program for the given candidate
 *
 * @param candidate the candidate to generate the AWS Runtime program for
 * @param endpoints endpoints of the connected services
 * @param qrms the set of QRMs currently available in the framework
 * @return the updated candidate with the URL to the deployment model for the generated AWS Runtime program or an error message if the generation fails
 */
export async function getAWSRuntimeProgramDeploymentModel(candidate, endpoints, qrms) {

  // check if all contained QuantumCircuitExecutionTasks belong to an execution with AWS as provider
  let quantumCircuitExecutionTasks = getQuantumCircuitExecutionTasks(candidate.containedElements);
  for (let i = 0; i < quantumCircuitExecutionTasks.length; i++) {
    if (quantumCircuitExecutionTasks[i].provider.toUpperCase() !== 'AWS') {
      console.log('Found QuantumCircuitExecutionTask with provider different than AWS: ', quantumCircuitExecutionTasks[i].provider);
      return { error: 'Only QuantumCircuitExecutionTasks with provider AWS supported for AWS Runtime!' };
    }
  }

  // extract workflow XML
  function exportXmlWrapper() {
    return new Promise((resolve) => {
      candidate.modeler.saveXML((err, successResponse) => {
        resolve(successResponse);
      });
    });
  }

  let xml = await exportXmlWrapper();

  // transform QuantME tasks within candidate
  let transformationResult = await startReplacementProcess(xml, qrms, endpoints);
  if (transformationResult.status === 'failed') {
    console.log('Unable to transform QuantME tasks within the candidates!');
    return { error: 'Unable to transform QuantME tasks within the candidates. Please provide valid QRMs!' };
  }

  // import transformed XML to the modeler
  let modeler = await createModelerFromXml(transformationResult.xml);
  let rootElement = getRootProcess(modeler.getDefinitions());

  // check if transformed XML contains invalid modeling constructs
  let invalidModelingConstruct = getInvalidModelingConstruct(rootElement);
  if (invalidModelingConstruct !== undefined) {
    console.log('Found invalid modeling construct of type: ', invalidModelingConstruct.$type);
    return { error: 'Modeling construct not suitable for AWS Runtime program generation: ' + invalidModelingConstruct.$type };
  }

  // check if all service tasks have either a deployment model attached and all script tasks provide the code inline and retrieve the files
  let requiredPrograms = await getRequiredPrograms(rootElement, endpoints.wineryEndpoint);
  if (requiredPrograms.error !== undefined) {
    return { error: requiredPrograms.error };
  }

  // invoke handler and return resulting hybrid program or error message
  let programBlobs = await invokeAWSRuntimeHandler(candidate, requiredPrograms, endpoints.awsRuntimeHandlerEndpoint, modeler);
  if (programBlobs.error !== undefined) {
    return { error: programBlobs.error };
  }

  // generate the deployment model to deploy the AWS Runtime program and the corresponding agent
  let deploymentModelUrl = await createDeploymentModel(candidate, programBlobs, endpoints.wineryEndpoint);
  if (deploymentModelUrl.error !== undefined) {
    return { error: deploymentModelUrl.error };
  }
  console.log('Received deployment model URL: ', deploymentModelUrl.deploymentModelUrl);
  candidate.deploymentModelUrl = deploymentModelUrl.deploymentModelUrl;

  // return candidate with added deployment model URL
  return candidate;
}

/**
 * Generate a deployment model to deploy the generated hybrid program and the corresponding agent
 *
 * @param candidate the candidate the hybrid program belongs to
 * @param programBlobs the blobs containing the data for the hybrid program and agent
 * @param wineryEndpoint endpoint of the Winery instance to create the deployment model
 * @return the URL of the generated deployment model, or an error if the generation failed
 */
async function createDeploymentModel(candidate, programBlobs, wineryEndpoint) {

  // create a new ArtifactTemplate and upload the agent file (the agent currently also contains the program and we deploy them together)
  let artifactName = await createNewArtifactTemplate(wineryEndpoint, 'hybrid-program-agent',
    'http://quantil.org/quantme/pull/artifacttemplates',
    '{http://opentosca.org/artifacttypes}DockerContainerArtifact', programBlobs.pollingAgentBlob,
    'hybrid_program_agent.zip');

  // create new ServiceTemplate for the hybrid program by adding a new version of the predefined template
  let serviceTemplateURL = await createNewServiceTemplateVersion(wineryEndpoint, 'AWSRuntimeAgentService', 'http://quantil.org/quantme/pull');
  if (serviceTemplateURL.error !== undefined) {
    return { error: serviceTemplateURL.error };
  }

  // update DA reference within the created ServiceTemplate version
  let getTemplateXmlResult = await fetch(serviceTemplateURL + 'xml');
  let getTemplateXmlResultJson = await getTemplateXmlResult.text();
  getTemplateXmlResultJson = getTemplateXmlResultJson.replace(':AWSRuntimeAgentContainer_DA"', ':' + artifactName + '"');
  await fetch(serviceTemplateURL, {
    method: 'PUT',
    body: getTemplateXmlResultJson,
    headers: { 'Content-Type': 'application/xml' }
  });

  // replace concrete Winery endpoint with abstract placeholder to enable QAA transfer into another environment
  let deploymentModelUrl = serviceTemplateURL.replace(wineryEndpoint, '{{ wineryEndpoint }}');
  deploymentModelUrl += '?csar';
  return { deploymentModelUrl: deploymentModelUrl };
}

/**
 * Generate a AWS Runtime program for the given candidate using the given set of quantum and classical programs
 *
 * @param candidate the candidate for which the AWS Runtime program should be generated
 * @param requiredPrograms the programs that have to be merged into the AWS Runtime program
 * @param awsRuntimeHandlerEndpoint the endpoint of the external AWS Runtime Handler performing the program generation
 * @param modeler the modeler comprising the transformed workflow model of the candidate
 * @return the generated AWS Runtime program if successful, an error message otherwise
 */
async function invokeAWSRuntimeHandler(candidate, requiredPrograms, awsRuntimeHandlerEndpoint, modeler) {

  // remove trailing slash from endpoint
  awsRuntimeHandlerEndpoint = awsRuntimeHandlerEndpoint.endsWith('/') ? awsRuntimeHandlerEndpoint.slice(0, -1) : awsRuntimeHandlerEndpoint;

  // calculate the order of the tasks within the candidate required for the generation in the AWS Runtime handler
  let taskOrder = getTaskOrder(candidate, modeler);
  let beforeLoop, afterLoop = null;
  if (taskOrder.beforeLoop.length !== 0) {
    beforeLoop = taskOrder.beforeLoop.toString();
  }
  if (taskOrder.afterLoop.length !== 0) {
    afterLoop = taskOrder.afterLoop.toString();
  }

  // create request containing information about the candidate and sent to AWS Runtime handler
  // eslint-disable-next-line no-undef
  const fd = new FormData();
  fd.append('beforeLoop', beforeLoop);
  fd.append('afterLoop', afterLoop);
  fd.append('loopCondition', candidate.expression.body);
  fd.append('requiredPrograms', requiredPrograms.programs);
  try {
    let generationResult = await performAjax(awsRuntimeHandlerEndpoint + '/aws-runtime-handler/api/v1.0/generate-hybrid-program', fd);

    // get location of the task object to poll
    if (!generationResult['Location']) {
      return { error: 'Received invalid response from AWS Runtime handler.' };
    }
    let taskLocation = awsRuntimeHandlerEndpoint + generationResult['Location'];

    // poll for task completion
    console.log('Polling for task completion at URL: ', taskLocation);
    let complete = false;
    let timeout = 0;
    let result = undefined;
    while (!complete) {
      let pollingResponse = await fetch(taskLocation);
      let pollingResponseJson = await pollingResponse.json();

      if (pollingResponseJson['complete'] === true || timeout >= 20) {
        complete = true;
        result = pollingResponseJson;
      }
      timeout++;
      console.log('Next polling iteration: ', timeout);

      await new Promise(r => setTimeout(r, 5000));
    }

    // check if generation was successful
    console.log('Polling result after completion or timeout: ', result);
    if (result['complete'] === false) {
      return { error: 'Hybrid program generation did not complete until timeout!' };
    }
    if (result['error']) {
      return { error: result['error'] };
    }

    // extract endpoint for the generated hybrid program and the related polling agent
    let hybridProgramUrl = awsRuntimeHandlerEndpoint + result['programUrl'];
    let pollingAgentUrl = awsRuntimeHandlerEndpoint + result['agentUrl'];

    // download and return files
    console.log('Downloading hybrid program from URL: ', hybridProgramUrl);
    let response = await fetch(hybridProgramUrl);
    let hybridProgramBlob = await response.blob();
    console.log('Downloading agent from URL: ', pollingAgentUrl);
    response = await fetch(pollingAgentUrl);
    let pollingAgentBlob = await response.blob();
    console.log('Successfully downloaded resulting hybrid program and agent!');
    return { hybridProgramBlob: hybridProgramBlob, pollingAgentBlob: pollingAgentBlob };
  } catch (e) {
    return { error: 'Unable to connect to the AWS Runtime handler.\nPlease check the endpoint!' };
  }
}
