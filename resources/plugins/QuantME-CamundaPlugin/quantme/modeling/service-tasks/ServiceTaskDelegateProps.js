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

// adapted from 'bpmn-js-properties-panel/lib/provider/camunda/parts/ServiceTaskDelegateProps' to support the Service Task extension

import { addImplementationDetails } from './ServiceTaskImplementationExtension';
import { getImplementationType } from './ImplementationTypeHelperExtension';
import { deployment } from './Deployment';

const ImplementationTypeHelper = require('bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper'),
      InputOutputHelper = require('bpmn-js-properties-panel/lib/helper/InputOutputHelper');

const utils = require('bpmn-js-properties-panel/lib/Utils'),
      escapeHTML = utils.escapeHTML,
      triggerClickEvent = utils.triggerClickEvent;

const delegate = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/Delegate'),
      external = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/External'),
      callable = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/Callable'),
      resultVariable = require('bpmn-js-properties-panel/lib/provider/camunda/parts/implementation/ResultVariable');

const entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

const domQuery = require('min-dom').query,
      domClosest = require('min-dom').closest,
      domClasses = require('min-dom').classes;

function getBusinessObject(element) {
  return ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element);
}

function isDmnCapable(element) {
  return ImplementationTypeHelper.isDmnCapable(element);
}

function isExternalCapable(element) {
  return ImplementationTypeHelper.isExternalCapable(element);
}

function isServiceTaskLike(element) {
  return ImplementationTypeHelper.isServiceTaskLike(element);
}

export function serviceTaskDelegateProps(group, element, bpmnFactory, translate, wineryEndpoint) {

  if (!isServiceTaskLike(getBusinessObject(element))) {
    return;
  }

  const hasDmnSupport = isDmnCapable(element);
  const hasExternalSupport = isExternalCapable(getBusinessObject(element));

  // implementation type ////////////////////////////////////

  group.entries = group.entries.concat(addImplementationDetails(element, bpmnFactory, {
    getBusinessObject: getBusinessObject,
    getImplementationType: getImplementationType,
    hasDmnSupport: hasDmnSupport,
    hasExternalSupport: hasExternalSupport,
    hasServiceTaskLikeSupport: true,
    hasDeploymentSupport: true
  }, translate));

  // delegate (class, expression, delegateExpression) //////////

  group.entries = group.entries.concat(delegate(element, bpmnFactory, {
    getBusinessObject: getBusinessObject,
    getImplementationType: getImplementationType
  }, translate));

  // result variable /////////////////////////////////////////

  group.entries = group.entries.concat(resultVariable(element, bpmnFactory, {
    getBusinessObject: getBusinessObject,
    getImplementationType: getImplementationType,
    hideResultVariable: function(element, node) {
      return getImplementationType(element) !== 'expression';
    }
  }, translate));

  // deployment //////////////////////////////////////////////////

  group.entries = group.entries.concat(deployment(element, bpmnFactory, {
    getBusinessObject: getBusinessObject,
    getImplementationType: getImplementationType
  }, translate, wineryEndpoint));

  // external //////////////////////////////////////////////////

  if (hasExternalSupport) {
    group.entries = group.entries.concat(external(element, bpmnFactory, {
      getBusinessObject: getBusinessObject,
      getImplementationType: getImplementationType
    }, translate));
  }

  // dmn ////////////////////////////////////////////////////////

  if (hasDmnSupport) {
    group.entries = group.entries.concat(callable(element, bpmnFactory, {
      getCallableType: getImplementationType
    }, translate));
  }

  // connector ////////////////////////////////////////////////

  const isConnector = function(element) {
    return getImplementationType(element) === 'connector';
  };

  group.entries.push(entryFactory.link({
    id: 'configureConnectorLink',
    label: translate('Configure Connector'),
    handleClick: function(element, node, event) {

      const connectorTabEl = getTabNode(node, 'connector');

      if (connectorTabEl) {
        triggerClickEvent(connectorTabEl);
      }

      // suppress actual link click
      return false;
    },
    showLink: function(element, node) {
      const link = domQuery('a', node);
      link.textContent = '';

      domClasses(link).remove('bpp-error-message');

      if (isConnector(element)) {
        const connectorId = InputOutputHelper.getConnector(element).get('connectorId');
        if (connectorId) {
          link.textContent = translate('Configure Connector');
        } else {
          link.innerHTML = '<span class="bpp-icon-warning"></span> ' + escapeHTML(translate('Must configure Connector'));
          domClasses(link).add('bpp-error-message');
        }

        return true;
      }

      return false;
    }
  }));
}

// helpers ///////////////////////////
function getTabNode(el, id) {
  var containerEl = domClosest(el, '.bpp-properties-panel');

  return domQuery('a[data-tab-target="' + id + '"]', containerEl);
}
