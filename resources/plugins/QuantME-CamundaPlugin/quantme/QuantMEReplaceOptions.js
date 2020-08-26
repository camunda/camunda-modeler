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

export var TASK = [
  {
    label: 'Quantum Computation Task',
    actionName: 'replace-with-quantum-computation-task',
    className: 'bpmn-icon-task-quantum-computation',
    target: {
      type: 'quantme:QuantumComputationTask'
    }
  },
  {
    label: 'Quantum Circuit Loading Task',
    actionName: 'replace-with-quantum-circuit-loading-task',
    className: 'bpmn-icon-circuit-loading',
    target: {
      type: 'quantme:QuantumCircuitLoadingTask'
    }
  },
  {
    label: 'Data Preparation Task',
    actionName: 'replace-with-data-preparation-task',
    className: 'bpmn-icon-data-preparation',
    target: {
      type: 'quantme:DataPreparationTask'
    }
  },
  {
    label: 'Oracle Expansion Task',
    actionName: 'replace-with-oracle-expansion-task',
    className: 'bpmn-icon-oracle-expansion',
    target: {
      type: 'quantme:OracleExpansionTask'
    }
  },
  {
    label: 'Quantum Circuit Execution Task',
    actionName: 'replace-with-quantum-circuit-execution-task',
    className: 'bpmn-icon-circuit-execution',
    target: {
      type: 'quantme:QuantumCircuitExecutionTask'
    }
  },
  {
    label: 'Readout-Error Mitigation Task',
    actionName: 'replace-with-readout-error-mitigation-task',
    className: 'bpmn-icon-error-mitigation',
    target: {
      type: 'quantme:ReadoutErrorMitigationTask'
    }
  }
];
