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

import QuantMERenderer from './QuantMERenderer';
import QuantMEReplaceMenuProvider from './QuantMEReplaceMenuProvider';
import QuantMEFactory from './QuantMEFactory';
import QuantMEPathMap from './QuantMEPathMap';
import QuantMEPropertiesProvider from './QuantMEPropertiesProvider';
import QuantMEReplacementUtility from './replacement/QuantMEReplacementUtility';

export default {
  __init__: ['quantMERenderer', 'quantMEReplaceMenu', 'bpmnFactory', 'quantMEPathMap', 'propertiesProvider', 'quantMEReplacementUtility'],
  quantMERenderer: ['type', QuantMERenderer],
  quantMEReplaceMenu: ['type', QuantMEReplaceMenuProvider],
  bpmnFactory: ['type', QuantMEFactory],
  quantMEPathMap: ['type', QuantMEPathMap],
  propertiesProvider: ['type', QuantMEPropertiesProvider],
  quantMEReplacementUtility: ['type', QuantMEReplacementUtility]
};
