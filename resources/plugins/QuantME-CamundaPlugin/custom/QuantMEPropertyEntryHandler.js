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

let EntryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');
let ModelUtil = require('bpmn-js/lib/util/ModelUtil');
let CmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

export function addAlgorithmEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: 'algorithm',
    label: translate('Algorithm'),
    modelProperty: 'algorithm',

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
    id: 'provider',
    label: translate('Provider'),
    modelProperty: 'provider',

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
    id: 'quantumCircuit',
    label: translate('Quantum Circuit'),
    modelProperty: 'quantumCircuit',

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
    id: 'url',
    label: translate('URL'),
    modelProperty: 'url',

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
    id: 'encodingSchema',
    label: translate('Encoding Schema'),
    modelProperty: 'encodingSchema',

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
    id: 'programmingLanguage',
    label: translate('Programming Language'),
    modelProperty: 'programmingLanguage',

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
    id: 'oracleId',
    label: translate('Oracle Id'),
    modelProperty: 'oracleId',

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
    id: 'oracleCircuit',
    label: translate('Oracle Circuit'),
    modelProperty: 'oracleCircuit',

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
    id: 'oracleURL',
    label: translate('Oracle URL'),
    modelProperty: 'oracleURL',

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
    id: 'qpu',
    label: translate('QPU'),
    modelProperty: 'qpu',

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
    id: 'shots',
    label: translate('Shots'),
    modelProperty: 'shots',

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

export function addUnfoldingTechniqueEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: 'unfoldingTechnique',
    label: translate('Unfolding Technique'),
    modelProperty: 'unfoldingTechnique',

    get: function(element, node) {
      let bo = ModelUtil.getBusinessObject(element);
      let unfoldingTechnique = bo && bo.unfoldingTechnique;
      return { unfoldingTechnique: unfoldingTechnique };
    },

    set: function(element, values, node) {
      let bo = ModelUtil.getBusinessObject(element);
      return CmdHelper.updateBusinessObject(element, bo, {
        unfoldingTechnique: values.unfoldingTechnique || undefined
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

export function addMaxAgeEntry(group, translate) {
  group.entries.push(EntryFactory.textField({
    id: 'maxAge',
    label: translate('Max Age (in minutes)'),
    modelProperty: 'maxAge',

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
