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

// QNames of the QuantME task types
export const QUANTUM_COMPUTATION_TASK = 'quantme:QuantumComputationTask';
export const QUANTUM_CIRCUIT_LOADING_TASK = 'quantme:QuantumCircuitLoadingTask';
export const DATA_PREPARATION_TASK = 'quantme:DataPreparationTask';
export const ORACLE_EXPANSION_TASK = 'quantme:OracleExpansionTask';
export const QUANTUM_CIRCUIT_EXECUTION_TASK = 'quantme:QuantumCircuitExecutionTask';
export const READOUT_ERROR_MITIGATION_TASK = 'quantme:ReadoutErrorMitigationTask';

// Property names of the QuantME tasks
export const ALGORITHM = 'algorithm';
export const PROVIDER = 'provider';
export const QUANTUM_CIRCUIT = 'quantumCircuit';
export const URL = 'url';
export const ENCODING_SCHEMA = 'encodingSchema';
export const PROGRAMMING_LANGUAGE = 'programmingLanguage';
export const ORACLE_ID = 'oracleId';
export const ORACLE_CIRCUIT = 'oracleCircuit';
export const ORACLE_URL = 'oracleURL';
export const QPU = 'qpu';
export const SHOTS = 'shots';
export const UNFOLDING_TECHNIQUE = 'unfoldingTechnique';
export const MAX_AGE = 'maxAge';

// list of QuantME attributes to check if a given attribute belongs to the extension or not
export const QUANTME_ATTRIBUTES = [ALGORITHM, PROVIDER, QUANTUM_CIRCUIT, URL, ENCODING_SCHEMA, PROGRAMMING_LANGUAGE,
  ORACLE_ID, ORACLE_CIRCUIT, ORACLE_URL, QPU, SHOTS, UNFOLDING_TECHNIQUE, MAX_AGE];
