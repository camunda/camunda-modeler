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
import { createModelerFromXml } from '../../quantme/Utilities';
import { startReplacementProcess } from '../../quantme/replacement/QuantMETransformator';
import {
  getQuantumCircuitExecutionTasks,
  getRootProcess,
  performAjax
} from 'client/src/app/quantme/utilities/Utilities';
import {
  createNewArtifactTemplate, createNewServiceTemplateVersion
} from 'client/src/app/quantme/deployment/OpenTOSCAUtils';
import { getInvalidModelingConstruct, getRequiredPrograms, getTaskOrder } from './RuntimeHandlerUtils';

/**
 * Generate a Qiskit Runtime program for the given candidate
 *
 * @param candidate the candidate to generate the Qiskit Runtime program for
 * @param modelerConfig current configuration of the modeler
 * @param qrms the set of QRMs currently available in the framework
 * @return the updated candidate with the URL to the deployment model for the generated Qiskit Runtime program or an error message if the generation fails
 */
export async function getQiskitRuntimeProgramDeploymentModel(candidate, modelerConfig, qrms) {

  // check if all contained QuantumCircuitExecutionTasks belong to an execution with IBMQ as provider
  let quantumCircuitExecutionTasks = getQuantumCircuitExecutionTasks(candidate.containedElements);
  for (let i = 0; i < quantumCircuitExecutionTasks.length; i++) {
    if (quantumCircuitExecutionTasks[i].provider.toUpperCase() !== 'IBMQ') {
      console.log('Found QuantumCircuitExecutionTask with provider different than IBMQ: ', quantumCircuitExecutionTasks[i].provider);
      return { error: 'Only QuantumCircuitExecutionTasks with provider IBMQ supported for Qiskit Runtime!' };
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
  let transformationResult = await startReplacementProcess(xml, qrms, modelerConfig);
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
    return { error: 'Modeling construct not suitable for Qiskit Runtime program generation: ' + invalidModelingConstruct.$type };
  }

  // check if all service tasks have either a deployment model attached and all script tasks provide the code inline and retrieve the files
  let requiredPrograms = await getRequiredPrograms(rootElement, modelerConfig.wineryEndpoint);
  if (requiredPrograms.error !== undefined) {
    return { error: requiredPrograms.error };
  }

  // invoke handler and return resulting hybrid program or error message
  let runtimeGenerationResult = await invokeQiskitRuntimeHandler(candidate, requiredPrograms, modelerConfig.qiskitRuntimeHandlerEndpoint,
    modelerConfig.hybridRuntimeProvenance, modeler);
  if (runtimeGenerationResult.error !== undefined) {
    return { error: runtimeGenerationResult.error };
  }

  // generate the deployment model to deploy the Qiskit Runtime program and the corresponding agent
  let deploymentModelUrl = await createDeploymentModel(candidate, runtimeGenerationResult, modelerConfig.wineryEndpoint);
  if (deploymentModelUrl.error !== undefined) {
    return { error: deploymentModelUrl.error };
  }
  console.log('Received deployment model URL: ', deploymentModelUrl.deploymentModelUrl);
  candidate.deploymentModelUrl = deploymentModelUrl.deploymentModelUrl;

  console.log('Hybrid program has ID: ', runtimeGenerationResult.hybridProgramId);
  candidate.hybridProgramId = runtimeGenerationResult.hybridProgramId;

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
  let serviceTemplateURL = await createNewServiceTemplateVersion(wineryEndpoint, 'QiskitRuntimeAgentService', 'http://quantil.org/quantme/pull');
  if (serviceTemplateURL.error !== undefined) {
    return { error: serviceTemplateURL.error };
  }

  // update DA reference within the created ServiceTemplate version
  let getTemplateXmlResult = await fetch(serviceTemplateURL + 'xml');
  let getTemplateXmlResultJson = await getTemplateXmlResult.text();
  getTemplateXmlResultJson = getTemplateXmlResultJson.replace(':QiskitRuntimeAgentContainer_DA"', ':' + artifactName + '"');
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
 * Generate a Qiskit Runtime program for the given candidate using the given set of quantum and classical programs
 *
 * @param candidate the candidate for which the Qiskit Runtime program should be generated
 * @param requiredPrograms the programs that have to be merged into the Qiskit Runtime program
 * @param qiskitRuntimeHandlerEndpoint the endpoint of the external Qiskit Runtime Handler performing the program generation
 * @param provenanceCollection a boolean specifying if the hybrid program to generate should include provenance collection
 * @param modeler the modeler comprising the transformed workflow model of the candidate
 * @return the generated Qiskit Runtime program if successful, an error message otherwise
 */
async function invokeQiskitRuntimeHandler(candidate, requiredPrograms, qiskitRuntimeHandlerEndpoint, provenanceCollection, modeler) {

  // remove trailing slash from endpoint
  qiskitRuntimeHandlerEndpoint = qiskitRuntimeHandlerEndpoint.endsWith('/') ? qiskitRuntimeHandlerEndpoint.slice(0, -1) : qiskitRuntimeHandlerEndpoint;

  // calculate the order of the tasks within the candidate required for the generation in the Qiskit Runtime handler
  let taskOrder = getTaskOrder(candidate, modeler);
  let beforeLoop, afterLoop = null;
  if (taskOrder.beforeLoop.length !== 0) {
    beforeLoop = taskOrder.beforeLoop.toString();
  }
  if (taskOrder.afterLoop.length !== 0) {
    afterLoop = taskOrder.afterLoop.toString();
  }

  // create request containing information about the candidate and sent to Qiskit Runtime handler
  // eslint-disable-next-line no-undef
  const fd = new FormData();
  fd.append('beforeLoop', beforeLoop);
  fd.append('afterLoop', afterLoop);
  fd.append('loopCondition', candidate.expression.body);
  fd.append('requiredPrograms', requiredPrograms.programs);
  fd.append('provenanceCollection', provenanceCollection);
  try {
    let generationResult = await performAjax(qiskitRuntimeHandlerEndpoint + '/qiskit-runtime-handler/api/v1.0/generate-hybrid-program', fd);

    // get location of the task object to poll
    if (!generationResult['Location']) {
      return { error: 'Received invalid response from Qiskit Runtime handler.' };
    }
    let taskLocation = qiskitRuntimeHandlerEndpoint + generationResult['Location'];

    // poll for task completion
    console.log('Polling for task completion at URL: ', taskLocation);
    let complete = false;
    let timeout = 0;
    let result = undefined;
    while (!complete) {
      timeout++;
      console.log('Next polling iteration: ', timeout);

      let pollingResponse = await fetch(taskLocation);
      let pollingResponseJson = await pollingResponse.json();

      if (pollingResponseJson['complete'] === true || timeout > 50) {
        complete = true;
        result = pollingResponseJson;
      }

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
    let hybridProgramUrl = qiskitRuntimeHandlerEndpoint + result['programUrl'];
    let pollingAgentUrl = qiskitRuntimeHandlerEndpoint + result['agentUrl'];

    // download and return files
    console.log('Downloading hybrid program from URL: ', hybridProgramUrl);
    let response = await fetch(hybridProgramUrl);
    let hybridProgramBlob = await response.blob();
    console.log('Downloading agent from URL: ', pollingAgentUrl);
    response = await fetch(pollingAgentUrl);
    let pollingAgentBlob = await response.blob();
    console.log('Successfully downloaded resulting hybrid program and agent!');
    return { hybridProgramBlob: hybridProgramBlob, pollingAgentBlob: pollingAgentBlob, hybridProgramId: result['id'] };
  } catch (e) {
    return { error: 'Unable to connect to the Qiskit Runtime handler.\nPlease check the endpoint!' };
  }
}
