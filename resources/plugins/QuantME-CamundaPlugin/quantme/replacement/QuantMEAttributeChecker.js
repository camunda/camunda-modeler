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

let ModelUtil = require('bpmn-js/lib/util/ModelUtil');
import * as consts from '../Constants';

/**
 * Check whether the given QuantME task has all required elements set
 *
 * @param element the element representing the QuantME task
 * @returns {boolean} true if attributes are available, otherwise false
 */
export function requiredAttributesAvailable(element) {

  // return false if business object can not be retrieved
  let bo = ModelUtil.getBusinessObject(element);
  if (!bo) {
    return false;
  }

  // check for attributes of the different task types
  switch (element.$type) {
  case consts.QUANTUM_COMPUTATION_TASK:
    return checkQuantumComputationTask(bo);
  case consts.QUANTUM_CIRCUIT_LOADING_TASK:
    return checkQuantumCircuitLoadingTask(bo);
  case consts.DATA_PREPARATION_TASK:
    return checkDataPreparationTask(bo);
  case consts.ORACLE_EXPANSION_TASK:
    return checkOracleExpansionTask(bo);
  case consts.QUANTUM_CIRCUIT_EXECUTION_TASK:
    return checkQuantumCircuitExecutionTask(bo);
  case consts.READOUT_ERROR_MITIGATION_TASK:
    return checkReadoutErrorMitigationTask(bo);
  default:
    console.log('Unsupported QuantME element of type: ', element.$type);
    return false;
  }
}

function checkQuantumComputationTask(bo) {

  // check if algorithm is defined
  return !(typeof bo.algorithm === 'undefined');
}

function checkQuantumCircuitLoadingTask(bo) {

  // check if either a circuit or an URL is defined
  return !(typeof bo.quantumCircuit === 'undefined' && typeof bo.url === 'undefined');
}

function checkDataPreparationTask(bo) {

  // check if encodingSchema and programmingLanguage are defined
  return !(typeof bo.encodingSchema === 'undefined' || typeof bo.programmingLanguage === 'undefined');
}

function checkOracleExpansionTask(bo) {

  // check if oracleId and programmingLanguage, as well as one of oracleCircuit and oracleFunction are defined
  return !(typeof bo.oracleId === 'undefined' || typeof bo.programmingLanguage === 'undefined'
    || (typeof bo.oracleCircuit === 'undefined' && typeof bo.oracleURL === 'undefined'));
}

function checkQuantumCircuitExecutionTask(bo) {

  // all attributes are optional
  return true;
}

function checkReadoutErrorMitigationTask(bo) {

  // check if unfoldingTechnique and qpu are defined
  return !(typeof bo.unfoldingTechnique === 'undefined' || typeof bo.qpu === 'undefined');
}
