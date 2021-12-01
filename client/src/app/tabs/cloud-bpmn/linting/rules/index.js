/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { createRule } from './Util';

import camundaCloud10 from './camundaCloud10';
import camundaCloud11 from './camundaCloud11';
import camundaCloud12 from './camundaCloud12';
import camundaCloud13 from './camundaCloud13';

export const camundaCloud10Rule = createRule('1.0', camundaCloud10);
export const camundaCloud11Rule = createRule('1.1', camundaCloud11);
export const camundaCloud12Rule = createRule('1.2', camundaCloud12);
export const camundaCloud13Rule = createRule('1.3', camundaCloud13);