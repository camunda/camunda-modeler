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

let EntryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');
let ModelUtil = require('bpmn-js/lib/util/ModelUtil');
let CmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');
import * as consts from 'client/src/app/quantme/Constants';

export function addAlgorithmEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.ALGORITHM,
    label: translate('Algorithm'),
    modelProperty: consts.ALGORITHM,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let algorithm = bo && bo.algorithm;
      return { algorithm: algorithm };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        algorithm: values.algorithm || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addProviderEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.PROVIDER,
    label: translate('Provider'),
    modelProperty: consts.PROVIDER,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let provider = bo && bo.provider;
      return { provider: provider };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        provider: values.provider || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addQuantumCircuitEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.QUANTUM_CIRCUIT,
    label: translate('Quantum Circuit'),
    modelProperty: consts.QUANTUM_CIRCUIT,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let quantumCircuit = bo && bo.quantumCircuit;
      return { quantumCircuit: quantumCircuit };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        quantumCircuit: values.quantumCircuit || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addUrlEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.URL,
    label: translate('URL'),
    modelProperty: consts.URL,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let url = bo && bo.url;
      return { url: url };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        url: values.url || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addEncodingSchemaEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.ENCODING_SCHEMA,
    label: translate('Encoding Schema'),
    modelProperty: consts.ENCODING_SCHEMA,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let encodingSchema = bo && bo.encodingSchema;
      return { encodingSchema: encodingSchema };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        encodingSchema: values.encodingSchema || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addProgrammingLanguageEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.PROGRAMMING_LANGUAGE,
    label: translate('Programming Language'),
    modelProperty: consts.PROGRAMMING_LANGUAGE,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let programmingLanguage = bo && bo.programmingLanguage;
      return { programmingLanguage: programmingLanguage };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        programmingLanguage: values.programmingLanguage || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addOracleIdEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.ORACLE_ID,
    label: translate('Oracle Id'),
    modelProperty: consts.ORACLE_ID,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let oracleId = bo && bo.oracleId;
      return { oracleId: oracleId };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        oracleId: values.oracleId || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addOracleCircuitEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.ORACLE_CIRCUIT,
    label: translate('Oracle Circuit'),
    modelProperty: consts.ORACLE_CIRCUIT,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let oracleCircuit = bo && bo.oracleCircuit;
      return { oracleCircuit: oracleCircuit };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        oracleCircuit: values.oracleCircuit || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addOracleURLEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.ORACLE_URL,
    label: translate('Oracle URL'),
    modelProperty: consts.ORACLE_URL,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let oracleURL = bo && bo.oracleURL;
      return { oracleURL: oracleURL };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        oracleURL: values.oracleURL || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addQpuEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.QPU,
    label: translate('QPU'),
    modelProperty: consts.QPU,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let qpu = bo && bo.qpu;
      return { qpu: qpu };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        qpu: values.qpu || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addShotsEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.SHOTS,
    label: translate('Shots'),
    modelProperty: consts.SHOTS,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let shots = bo && bo.shots;
      return { shots: shots };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        shots: values.shots || undefined
      });
    },

    validate: function(element, values, node) {
      return values.shots && isNaN(values.shots) ? { shots: translate('Shots attribute must contain an Integer!') } : {};
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addMaxAgeEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.MAX_AGE,
    label: translate('Max Age (in minutes)'),
    modelProperty: consts.MAX_AGE,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let maxAge = bo && bo.maxAge;
      return { maxAge: maxAge };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        maxAge: values.maxAge || undefined
      });
    },

    validate: function(element, values, node) {
      return values.maxAge && isNaN(values.maxAge) ? { maxAge: translate('MaxAge attribute must contain an Integer!') } : {};
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addProvidersEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.PROVIDERS,
    label: translate('Providers for the Selection'),
    modelProperty: consts.PROVIDERS,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let providers = bo && bo.providers;
      return { providers: providers };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        providers: values.providers || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addSimulatorsAllowedEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.SIMULATORS_ALLOWED,
    label: translate('Simulators Allowed (true/false)'),
    modelProperty: consts.SIMULATORS_ALLOWED,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let simulatorsAllowed = bo && bo.simulatorsAllowed;
      return { simulatorsAllowed: simulatorsAllowed };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        simulatorsAllowed: values.simulatorsAllowed || undefined
      });
    },

    validate: function(element, values, node) {
      return values.simulatorsAllowed === undefined || (values.simulatorsAllowed !== 'true' && values.simulatorsAllowed !== 'false') ? { simulatorsAllowed: translate('Simulators Allowed must either be true or false!') } : {};
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addSelectionStrategyEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.SELECTION_STRATEGY,
    label: translate('Selection Strategy'),
    modelProperty: consts.SELECTION_STRATEGY,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let selectionStrategy = bo && bo.selectionStrategy;
      return { selectionStrategy: selectionStrategy };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        selectionStrategy: values.selectionStrategy || undefined
      });
    },

    validate: function(element, values, node) {
      return (values.selectionStrategy && !consts.SELECTION_STRATEGY_LIST.includes(values.selectionStrategy)) ? { selectionStrategy: translate('Please define a supported selection strategy (see docs)!') } : {};
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addCalibrationMethodEntry(group, translate) {
  group.entries.push(EntryFactory.selectBox({
    id: consts.CALIBRATION_METHOD,
    label: translate('Calibration Matrix Generation Method'),
    selectOptions: [
      { value:'fullMatrix',name:'Full Matrix' } , { value:'tpnm',name:'TPNM' }, { value:'ctmp',name:'CTMP' } , { value:'ddot',name:'DDOT' }, { value:'conditionallyRigorous',name:'Conditionally Rigorous' } ,
      { value:'fuzzyCMeans',name:'Fuzzy C-Means' } , { value:'cumulantCM',name:'Cumulant CM' } , { value:'sclableTMatrix',name:'Sclable T-Matrix' }
    ],
    modelProperty: consts.CALIBRATION_METHOD,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let calibrationMethod = bo && bo.calibrationMethod;
      return { calibrationMethod: calibrationMethod };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        calibrationMethod: values.calibrationMethod || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let mitigationMethod = bo && bo.mitigationMethod;
      return !(mitigationMethod === 'matrixInversion' || mitigationMethod === 'pertubativeREM' || mitigationMethod === 'geneticBasedREM' || mitigationMethod === 'mthree');
    }
  }));
}

export function addMitigationMethodEntry(group, translate) {
  group.entries.push(EntryFactory.selectBox({
    id: consts.MITIGATION_METHOD,
    label: translate('Mitigation Method'),
    selectOptions: [
      { value:'matrixInversion',name:'Matrix Inversion' } , { value:'pertubativeREM',name:'Pertubative REM' }, { value:'mthree',name:'Mthree' }, { value:'geneticBasedREM',name:'Genetic-Based REM' },
      { value:'activeREM',name:'Active REM' } , { value:'modelFreeREM',name:'Model-Free REM' }, { value:'hybridREM',name:'Hybrid REM' }, { value:'crosstalkREM',name:'Crosstalk-Focused REM' },
      { value:'sim',name:'SIM' } , { value:'aim',name:'AIM' }, { value:'bfa',name:'BFA' }, { value:'truncatedNeumannSeries',name:'Truncated Neumann Series' },
      { value:'lsu',name:'LSU' } , { value:'dnnREM',name:'DNN-Based REM' }
    ],
    modelProperty: consts.MITIGATION_METHOD,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let mitigationMethod = bo && bo.mitigationMethod;
      return { mitigationMethod: mitigationMethod };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      const isCM = (values.mitigationMethod === 'matrixInversion' || values.mitigationMethod === 'pertubativeREM' || values.mitigationMethod === 'geneticBasedREM' || values.mitigationMethod === 'mthree');

      // remove CM value if non CM method is selected
      if (!isCM) {
        return CmdHelper.updateBusinessObject(element, bo, {
          mitigationMethod: values.mitigationMethod || undefined,
          calibrationMethod: undefined
        });
      } // set default CM value if CM method is selected and non CM method was selected previously
      else if (isCM && !bo.calibrationMethod) {
        return CmdHelper.updateBusinessObject(element, bo, {
          mitigationMethod: values.mitigationMethod || undefined,
          calibrationMethod: 'fullMatrix'
        });
      }
      return CmdHelper.updateBusinessObject(element, bo, {
        mitigationMethod: values.mitigationMethod || undefined,
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addDNNHiddenLayersEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.DNN_HIDDEN_LAYER,
    label: translate('Number of DNN Hidden Layers'),
    modelProperty: consts.DNN_HIDDEN_LAYER,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let dnnHiddenLayer = bo && bo.dnnHiddenLayer;
      return { dnnHiddenLayer: dnnHiddenLayer };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        dnnHiddenLayer: values.dnnHiddenLayer || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let mitigationMethod = bo && bo.mitigationMethod;
      return !(mitigationMethod === 'dnnREM');
    }
  }));
}

export function addNeighborhoodRangeEntry(group, translate) {

  // const mm = group.entries.get(consts.MITIGATION_METHOD);
  group.entries.push(EntryFactory.textField({
    id: consts.NEIGHBORHOOD_RANGE,
    label: translate('Neighborhood Range'),
    modelProperty: consts.NEIGHBORHOOD_RANGE,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let neighborhoodRange = bo && bo.neighborhoodRange;
      return { neighborhoodRange: neighborhoodRange };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        neighborhoodRange: values.neighborhoodRange || undefined
      });
    },

    validate: function(element, values, node) {
      return values.neighborhoodRange && isNaN(values.neighborhoodRange) ? { neighborhoodRange: translate('Shots attribute must contain an Integer!') } : {};
    },

    hidden: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let calibrationMethod = bo && bo.calibrationMethod;
      return !(calibrationMethod === 'sclableTMatrix');
    }
  }));
}

export function addObjectiveFunctionEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.OBJECTIVE_FUNCTION,
    label: translate('Objective Function'),
    modelProperty: consts.OBJECTIVE_FUNCTION,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let objectiveFunction = bo && bo.objectiveFunction;
      return { objectiveFunction: objectiveFunction };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        objectiveFunction: values.objectiveFunction || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let mitigationMethod = bo && bo.mitigationMethod;
      return !(mitigationMethod === 'geneticBasedREM');
    }
  }));
}

export function addOptimizerEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.OPTIMIZER,
    label: translate('Optimizer'),
    modelProperty: consts.OPTIMIZER,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let optimizer = bo && bo.optimizer;
      return { optimizer: optimizer };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        optimizer: values.optimizer || undefined
      });
    },

    validate: function(element, values, node) {
      return true;
    },

    hidden: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let mitigationMethod = bo && bo.mitigationMethod;
      return !(mitigationMethod === 'geneticBasedREM');
    }
  }));
}

export function addMaxREMCostsEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.MAX_REM_COSTS,
    label: translate('Max REM Costs (in $)'),
    modelProperty: consts.MAX_REM_COSTS,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let maxREMCosts = bo && bo.maxREMCosts;
      return { maxREMCosts: maxREMCosts };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        maxREMCosts: values.maxREMCosts || undefined
      });
    },

    validate: function(element, values, node) {
      return values.maxREMCosts && isNaN(values.maxREMCosts) ? { maxREMCosts: translate('Max REM Costs attribute must contain an Integer!') } : {};
    },

    hidden: function(element, node) {
      return false;
    }
  }));
}

export function addMaxCMSizeEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: consts.MAX_CM_SIZE,
    label: translate('Max CM Size (in MB)'),
    modelProperty: consts.MAX_CM_SIZE,

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let maxCMSize = bo && bo.maxCMSize;
      return { maxCMSize: maxCMSize };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        maxCMSize: values.maxCMSize || undefined
      });
    },

    validate: function(element, values, node) {
      return values.maxCMSize && isNaN(values.maxCMSize) ? { maxCMSize: translate('Max CM Size attribute must contain an Integer!') } : {};
    },

    hidden: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let mitigationMethod = bo && bo.mitigationMethod;
      return !(mitigationMethod === 'matrixInversion' || mitigationMethod === 'pertubativeREM' || mitigationMethod === 'geneticBasedREM' || mitigationMethod === 'mthree');
    }
  }));
}
