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

import ReplaceMenuProvider from 'bpmn-js/lib/features/popup-menu/ReplaceMenuProvider';
import * as quantmeReplaceOptions from './QuantMEReplaceOptions';
import { is } from 'bpmn-js/lib/util/ModelUtil';

/**
 * This class extends the default ReplaceMenuProvider with the newly introduced QuantME task types
 */
export default class QuantMEReplaceMenuProvider extends ReplaceMenuProvider {
  constructor(popupMenu, modeling, moddle, bpmnReplace, rules, translate) {
    super(popupMenu, modeling, moddle, bpmnReplace, rules, translate);
  }

  /**
   * Overwrites the default menu provider to add the QuantME task types as replacement options for elements of type bpmn:Task
   *
   * @param element the element for which the replacement entries are requested
   * @returns {*} an array with menu entries of possible replacements
   */
  getEntries(element) {
    var options = super.getEntries(element);

    // add additional elements to replace tasks
    if (is(element, 'bpmn:Task')) {
      options = options.concat(super._createEntries(element, quantmeReplaceOptions.TASK));
    }
    return options;
  }
}

QuantMEReplaceMenuProvider.$inject = [
  'popupMenu',
  'modeling',
  'moddle',
  'bpmnReplace',
  'rules',
  'translate'
];
