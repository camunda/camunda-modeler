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

import BpmnFactory from 'bpmn-js/lib/features/modeling/BpmnFactory';

/**
 * This class implements functionality when creating shapes representing QuantME tasks
 */
export default class QuantMEFactory extends BpmnFactory {
  constructor(moddle) {
    super(moddle);
  }

  _ensureId(element) {

    // handle all non QuantME elements as usual
    if (!isQuantME(element)) {
      super._ensureId(element);
      return;
    }

    // add an Id to QuantME elements if not already defined
    if (!element.id) {
      var prefix = (element.$type || '').replace(/^[^:]*:/g, '') + '_';
      element.id = this._model.ids.nextPrefixed(prefix, element);
    }
  }
}

function isQuantME(element) {
  return element.$type.startsWith('quantme:');
}

QuantMEFactory.$inject = ['moddle'];
