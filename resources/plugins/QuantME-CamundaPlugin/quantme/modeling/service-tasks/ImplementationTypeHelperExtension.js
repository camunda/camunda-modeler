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

const extensionsElementHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper');
const implementationTypeHelper = require('bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper');

export function getImplementationType(element) {

  let bo = implementationTypeHelper.getServiceTaskLikeBusinessObject(element);

  if (!bo) {
    if (implementationTypeHelper.isListener(element)) {
      bo = element;
    } else {
      return;
    }
  }

  if (implementationTypeHelper.isDmnCapable(bo)) {
    const decisionRef = bo.get('camunda:decisionRef');
    if (typeof decisionRef !== 'undefined') {
      return 'dmn';
    }
  }

  if (implementationTypeHelper.isServiceTaskLike(bo)) {
    const connectors = extensionsElementHelper.getExtensionElements(bo, 'camunda:Connector');
    if (typeof connectors !== 'undefined') {
      return 'connector';
    }
  }

  if (implementationTypeHelper.isExternalCapable(bo)) {
    const type = bo.get('camunda:type');
    if (type === 'external') {
      return 'external';
    }
  }

  const cls = bo.get('camunda:class');
  if (typeof cls !== 'undefined') {
    return 'class';
  }

  const expression = bo.get('camunda:expression');
  if (typeof expression !== 'undefined') {
    return 'expression';
  }

  const delegateExpression = bo.get('camunda:delegateExpression');
  if (typeof delegateExpression !== 'undefined') {
    return 'delegateExpression';
  }

  const deploymentModelUrl = bo.get('quantme:deploymentModelUrl');
  if (typeof deploymentModelUrl !== 'undefined') {
    return 'deploymentModel';
  }

  if (implementationTypeHelper.isListener(bo)) {
    const script = bo.get('script');
    if (typeof script !== 'undefined') {
      return 'script';
    }
  }
}
