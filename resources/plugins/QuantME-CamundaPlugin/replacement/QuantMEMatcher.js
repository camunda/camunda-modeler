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
import { getRootProcess, isQuantMETask } from './Utilities';

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
    let flowElements = rootProcess.flowElements;
    if (flowElements.length !== 1) {
      console.log('Detector contains %i flow elements but must contain exactly one!', flowElements.length);
      return false;
    }
    let detectorElement = flowElements[0];
    if (!isQuantMETask(detectorElement)) {
      console.log('Contained task is no QuantME task: %s', detectorElement.$task);
      return false;
    }

    // check if QuantME task of the QRM matches the given task
    return this.taskMatchesDetector(detectorElement, task);
  }

  /**
   * Check if the given task matches the detector, i.e., has the same QuantME type and matching attributes
   *
   * For details of the matching concepts see: https://github.com/UST-QuAntiL/QuantME-TransformationFramework/tree/develop/docs/quantme/qrm
   *
   * @param detectorElement the QuantME task from the detector
   * @param task the task to check
   * @return true if the detector matches the task, false otherwise
   */
  static taskMatchesDetector(detectorElement, task) {
    if (detectorElement.$type !== task.$type) {
      console.log('Types of detector and task do not match!');
      return false;
    }

    // check for attributes of the different task types
    switch (task.$type) {
    case 'quantme:QuantumComputationTask':
      return QuantMEMatcher.matchQuantumComputationTask(detectorElement, task);
    case 'quantme:QuantumCircuitLoadingTask':
      return QuantMEMatcher.matchQuantumCircuitLoadingTask(detectorElement, task);
    case 'quantme:DataPreparationTask':
      return QuantMEMatcher.matchDataPreparationTask(detectorElement, task);
    case 'quantme:OracleExpansionTask':
      return QuantMEMatcher.matchOracleExpansionTask(detectorElement, task);
    case 'quantme:QuantumCircuitExecutionTask':
      return QuantMEMatcher.matchQuantumCircuitExecutionTask(detectorElement, task);
    case 'quantme:ReadoutErrorMitigationTask':
      return QuantMEMatcher.matchReadoutErrorMitigationTask(detectorElement, task);
    default:
      console.log('Unsupported QuantME element of type: ', task.$type);
      return false;
    }
  }

  /**
   * Compare the properties of QuantumComputationTasks
   */
  static matchQuantumComputationTask(detectorElement, task) {
    // check if algorithm and provider match
    return this.matchesProperty(detectorElement.algorithm, task.algorithm, true)
      && this.matchesProperty(detectorElement.provider, task.provider, false);
  }

  /**
   * Compare the properties of QuantumCircuitLoadingTasks
   */
  static matchQuantumCircuitLoadingTask(detectorElement, task) {
    // TODO
    return false;
  }

  /**
   * Compare the properties of DataPreparationTasks
   */
  static matchDataPreparationTask(detectorElement, task) {
    // check if encodingSchema and programmingLanguage match
    return this.matchesProperty(detectorElement.encodingSchema, task.encodingSchema, true)
      && this.matchesProperty(detectorElement.programmingLanguage, task.programmingLanguage, true);
  }

  /**
   * Compare the properties of OracleExpansionTasks
   */
  static matchOracleExpansionTask(detectorElement, task) {
    // TODO
    return false;
  }

  /**
   * Compare the properties of QuantumCircuitExecutionTasks
   */
  static matchQuantumCircuitExecutionTask(detectorElement, task) {
    // check if provider, qpu, shots, and programmingLanguage match
    return this.matchesProperty(detectorElement.provider, task.provider, false)
      && this.matchesProperty(detectorElement.qpu, task.qpu, false)
      && this.matchesProperty(String(detectorElement.shots), String(task.shots), false)
      && this.matchesProperty(String(detectorElement.programmingLanguage), String(task.programmingLanguage), true);
  }

  /**
   * Compare the properties of ReadoutErrorMitigationTask
   */
  static matchReadoutErrorMitigationTask(detectorElement, task) {
    // check if unfoldingTechnique, qpu, and maxAge match
    return this.matchesProperty(detectorElement.unfoldingTechnique, task.unfoldingTechnique, true)
      && this.matchesProperty(detectorElement.qpu, task.qpu, true)
      && this.matchesProperty(String(detectorElement.maxAge), String(task.maxAge), false);
  }

  /**
   * Check if the attribute value of the detector mateches the value of the task
   *
   * @param detectorProperty the value of the detector for a certain attribute
   * @param taskProperty the value of the task for a certain attribute
   * @param required true if the attribute is required, false otherwise
   * @return true if the attribute values of the detector and the task match, false otherwise
   */
  static matchesProperty(detectorProperty, taskProperty, required) {
    // the detector has to define the attribute for a matching
    if (detectorProperty === undefined) {
      return false;
    }

    // if wildcard is defined any value matches
    if (detectorProperty === '*') {
      return true;
    }

    // if an attribute is not defined in the task to replace, any value can be used if the attribute is not required
    if (taskProperty === undefined) {
      return !required; // TODO: choice attributes?
    }

    // if the detector defines multiple values for the attribute, one has to match the task to replace
    if (detectorProperty.includes(',')) {
      let valueList = detectorProperty.split(',');
      for (let i = 0; i < valueList.length; i++) {
        if (valueList[i].trim() === taskProperty.trim()) {
          return true;
        }
      }
      return false;
    }

    // if the detector contains only one value it has to match exactly
    return detectorProperty.trim() === taskProperty.trim();
  }
}
