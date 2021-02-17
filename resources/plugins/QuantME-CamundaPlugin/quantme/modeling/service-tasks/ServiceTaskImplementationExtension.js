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
      cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
      extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper'),
      elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper');

const assign = require('lodash/assign');
const map = require('lodash/map');

const DEFAULT_DELEGATE_PROPS = ['class', 'expression', 'delegateExpression'];

const DELEGATE_PROPS = {
  'camunda:class': undefined,
  'camunda:expression': undefined,
  'camunda:delegateExpression': undefined,
  'camunda:resultVariable': undefined
};

const DMN_CAPABLE_PROPS = {
  'camunda:decisionRef': undefined,
  'camunda:decisionRefBinding': 'latest',
  'camunda:decisionRefVersion': undefined,
  'camunda:mapDecisionResult': 'resultList',
  'camunda:decisionRefTenantId': undefined
};

const EXTERNAL_CAPABLE_PROPS = {
  'camunda:type': undefined,
  'camunda:topic': undefined
};

export function addImplementationDetails(element, bpmnFactory, options, translate) {

  const DEFAULT_OPTIONS = [
    { value: 'class', name: translate('Java Class') },
    { value: 'expression', name: translate('Expression') },
    { value: 'delegateExpression', name: translate('Delegate Expression') }
  ];

  const DEPLOYMENT_OPTIONS = [
    { value: 'deploymentModel', name: translate('Deployment Model') }
  ];

  const DMN_OPTION = [
    { value: 'dmn', name: translate('DMN') }
  ];

  const EXTERNAL_OPTION = [
    { value: 'external', name: translate('External') }
  ];

  const CONNECTOR_OPTION = [
    { value: 'connector', name: translate('Connector') }
  ];

  const SCRIPT_OPTION = [
    { value: 'script', name: translate('Script') }
  ];

  const getType = options.getImplementationType,
        getBusinessObject = options.getBusinessObject;

  const hasDmnSupport = options.hasDmnSupport,
        hasExternalSupport = options.hasExternalSupport,
        hasServiceTaskLikeSupport = options.hasServiceTaskLikeSupport,
        hasScriptSupport = options.hasScriptSupport,
        hasDeploymentSupport = options.hasDeploymentSupport;

  const entries = [];

  let selectOptions = DEFAULT_OPTIONS.concat([]);

  if (hasDmnSupport) {
    selectOptions = selectOptions.concat(DMN_OPTION);
  }

  if (hasExternalSupport) {
    selectOptions = selectOptions.concat(EXTERNAL_OPTION);
  }

  if (hasServiceTaskLikeSupport) {
    selectOptions = selectOptions.concat(CONNECTOR_OPTION);
  }

  if (hasScriptSupport) {
    selectOptions = selectOptions.concat(SCRIPT_OPTION);
  }

  if (hasDeploymentSupport) {
    selectOptions = selectOptions.concat(DEPLOYMENT_OPTIONS);
  }

  selectOptions.push({ value: '' });

  entries.push(entryFactory.selectBox({
    id: 'implementation',
    label: translate('Implementation'),
    selectOptions: selectOptions,
    modelProperty: 'implType',

    get: function(element, node) {
      return {
        implType: getType(element) || ''
      };
    },

    set: function(element, values, node) {
      const bo = getBusinessObject(element);
      const oldType = getType(element);
      const newType = values.implType;

      let props = assign({}, DELEGATE_PROPS);

      if (DEFAULT_DELEGATE_PROPS.indexOf(newType) !== -1) {

        let newValue = '';
        if (DEFAULT_DELEGATE_PROPS.indexOf(oldType) !== -1) {
          newValue = bo.get('camunda:' + oldType);
        }
        props['camunda:' + newType] = newValue;
      }

      if (hasDmnSupport) {
        props = assign(props, DMN_CAPABLE_PROPS);
        if (newType === 'dmn') {
          props['camunda:decisionRef'] = '';
        }
      }

      if (hasExternalSupport) {
        props = assign(props, EXTERNAL_CAPABLE_PROPS);
        if (newType === 'external') {
          props['camunda:type'] = 'external';
          props['camunda:topic'] = '';
        }
      }

      if (hasScriptSupport) {
        props['camunda:script'] = undefined;

        if (newType === 'script') {
          props['camunda:script'] = elementHelper.createElement('camunda:Script', {}, bo, bpmnFactory);
        }
      }

      if (hasDeploymentSupport) {
        props['quantme:deploymentModelUrl'] = undefined;

        if (newType === 'deploymentModel') {
          props['quantme:deploymentModelUrl'] = '';
        }
      }

      const commands = [];
      commands.push(cmdHelper.updateBusinessObject(element, bo, props));

      if (hasServiceTaskLikeSupport) {
        const connectors = extensionElementsHelper.getExtensionElements(bo, 'camunda:Connector');
        commands.push(map(connectors, function(connector) {
          return extensionElementsHelper.removeEntry(bo, element, connector);
        }));

        if (newType === 'connector') {
          let extensionElements = bo.get('extensionElements');
          if (!extensionElements) {
            extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
            commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
          }
          const connector = elementHelper.createElement('camunda:Connector', {}, extensionElements, bpmnFactory);
          commands.push(cmdHelper.addAndRemoveElementsFromList(
            element,
            extensionElements,
            'values',
            'extensionElements',
            [connector],
            []
          ));
        }
      }

      return commands;
    }
  }));

  return entries;
}
