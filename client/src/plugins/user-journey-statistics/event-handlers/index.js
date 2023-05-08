/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import DeploymentEventHandler from './DeploymentEventHandler';
import LinkEventHandler from './LinkEventHandler';
import OverlayEventHandler from './OverlayEventHandler';
import PingEventHandler from './PingEventHandler';
import TabEventHandler from './TabEventHandler';
import FormEditorEventHandler from './FormEditorEventHandler';
import ModelingEventHandler from './ModelingEventHandler';

export default [
  DeploymentEventHandler,
  FormEditorEventHandler,
  LinkEventHandler,
  OverlayEventHandler,
  PingEventHandler,
  TabEventHandler,
  ModelingEventHandler
];
