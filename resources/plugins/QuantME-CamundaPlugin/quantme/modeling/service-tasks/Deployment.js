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

const entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
      cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

const jquery = require('jquery');

const QUANTME_NAMESPACE_PULL = 'http://quantil.org/quantme/pull';
const QUANTME_NAMESPACE_PUSH = 'http://quantil.org/quantme/push';

export function deployment(element, bpmnFactory, options, translate, wineryEndpoint) {

  const getImplementationType = options.getImplementationType,
        getBusinessObject = options.getBusinessObject;

  const deploymentEntry = entryFactory.selectBox({
    id: 'deployment',
    label: translate('CSAR Name'),
    dataValueLabel: 'deploymentModelUrlLabel',
    modelProperty: 'deploymentModelUrl',

    selectOptions: function(element, node) {
      const arrValues = [];
      jquery.ajax({
        url: wineryEndpoint + '/servicetemplates/?grouped',
        method :'GET',
        success: function(result) {
          let checks = 0;
          for (let i = 0; i < result.length; i++) {
            if (result[i].text === QUANTME_NAMESPACE_PULL) {
              result[i].children.forEach(element => arrValues.push({ name: element.text, value: concatenateCsarEndpoint(wineryEndpoint, result[i].id, element.text) }));
              checks++;
            }
            if (result[i].text === QUANTME_NAMESPACE_PUSH) {
              result[i].children.forEach(element => arrValues.push({ name: element.text, value: concatenateCsarEndpoint(wineryEndpoint, result[i].id, element.text) }));
              checks++;
            }
            if (checks === 2) {
              break;
            }
          }
        },
        async: false
      });
      if (arrValues.length === 0) {
        arrValues.push({ name: 'No CSARs available', value:'' });
      }
      return arrValues;
    },
    setControlValue: true,

    get: function(element, node) {
      let bo = getBusinessObject(element);
      let deploymentModelUrl = bo && bo.get('quantme:deploymentModelUrl');
      return {
        deploymentModelUrl: deploymentModelUrl,
        deploymentModelUrlLabel: translate('CSAR Name')
      };
    },

    set: function(element, values, node) {
      let bo = getBusinessObject(element);
      let prop = { deploymentModelUrl: values.deploymentModelUrl || '' };
      return cmdHelper.updateBusinessObject(element, bo, prop);
    },

    validate: function(element, values, node) {
      return getImplementationType(element) === 'deploymentModel' && !values.deploymentModelUrl ? { deploymentModelUrl: translate('Must provide a CSAR') } : {};
    },

    hidden: function(element, node) {
      return !(getImplementationType(element) === 'deploymentModel');
    }
  });

  return [deploymentEntry];
}

function concatenateCsarEndpoint(wineryEndpoint, namespace, csarName) {
  return wineryEndpoint + '/servicetemplates/' + encodeURIComponent(namespace) + '/' + csarName + '/?csar';
}
