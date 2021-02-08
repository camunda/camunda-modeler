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

import { registerBpmnJSModdleExtension, registerBpmnJSPlugin, registerClientExtension } from 'camunda-modeler-plugin-helpers';
import ModdleExtension from '../resources/quantum4bpmn.json';
import quantmeModelingModule from '../quantme/modeling';
import QuantMEController from '../quantme/control/QuantMEController';

registerBpmnJSModdleExtension(ModdleExtension);

registerBpmnJSPlugin(quantmeModelingModule);

registerClientExtension(QuantMEController);
