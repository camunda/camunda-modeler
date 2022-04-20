/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { ENGINES } from '../../util/Engines';

import { getEngineProfile as parseEngineProfile } from '../../util/parse';

import {
  find,
  keys
} from 'min-dash';

const BPMN_TAB_TYPE = 'bpmn';
const CLOUD_BPMN_TAB_TYPE = 'cloud-bpmn';
const DMN_TAB_TYPE = 'dmn';
const CLOUD_DMN_TAB_TYPE = 'cloud-dmn';

const DIAGRAM_BY_TAB_TYPE = {
  'bpmn': [ BPMN_TAB_TYPE, CLOUD_BPMN_TAB_TYPE ],
  'dmn': [ DMN_TAB_TYPE, CLOUD_DMN_TAB_TYPE ]
};


function getDefaultExecutionPlatform(type) {
  if (/^cloud/.test(type)) {
    return ENGINES.CLOUD;
  }

  return ENGINES.PLATFORM;
}

export async function getEngineProfile(tab) {
  const {
    file,
    type
  } = tab;

  const {
    contents
  } = file;

  if (!contents) {
    return {};
  }

  const {
    executionPlatform,
    executionPlatformVersion
  } = await parseEngineProfile(contents, type);

  let engineProfile = {
    executionPlatform: executionPlatform || getDefaultExecutionPlatform(type),
  };

  if (executionPlatformVersion) {
    engineProfile.executionPlatformVersion = executionPlatformVersion;
  }

  return engineProfile;
}

export function getDiagramType(tabType) {
  return find(keys(DIAGRAM_BY_TAB_TYPE), function(diagramType) {
    return DIAGRAM_BY_TAB_TYPE[diagramType].includes(tabType);
  });
}