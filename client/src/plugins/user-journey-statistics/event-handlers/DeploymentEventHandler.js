/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  keys,
  find
} from 'min-dash';

import { getEngineProfile } from '../../../util/parse';

const BPMN_TAB_TYPE = 'bpmn';
const CLOUD_BPMN_TAB_TYPE = 'cloud-bpmn';
const DMN_TAB_TYPE = 'dmn';
const CLOUD_DMN_TAB_TYPE = 'cloud-dmn';

const DIAGRAM_BY_TAB_TYPE = {
  'bpmn': [ BPMN_TAB_TYPE, CLOUD_BPMN_TAB_TYPE ],
  'dmn': [ DMN_TAB_TYPE, CLOUD_DMN_TAB_TYPE ]
};

export default class DeploymentEventHandler {
  constructor(props) {

    const {
      subscribe,
      track
    } = props;

    this.track = track;

    this.subscribeToDeploymentEvents(subscribe);
  }

    subscribeToDeploymentEvents = (subscribe) => {

      subscribe('deployment.done', async (event) => {
        const { tab } = event;
        const type = getDiagramType(tab.type);

        await this.trackDeploymentAction(type, true, event);
      });

      subscribe('deployment.error', async (event) => {
        const { tab } = event;
        const type = getDiagramType(tab.type);

        await this.trackDeploymentAction(type, false, event);
      });

    }

    trackDeploymentAction = async (diagramType, success, event) => {
      const {
        context,
        deployedTo,
        targetType,
        error,
        tab
      } = event;

      const {
        file
      } = tab;

      const {
        contents
      } = file;

      if (!diagramType) {
        return;
      }

      const baseEvent = context === 'deploymentTool' ? 'deploy' : 'startInstance';
      const outcome = success ? 'success' : 'error';

      const eventName = baseEvent + ':' + outcome;

      const engineProfile = await getEngineProfile(contents, diagramType);

      let payload = {
        diagramType,
        ...engineProfile
      };

      if (targetType) {
        payload = {
          ...payload,
          targetType
        };
      }

      if (!success) {
        payload = {
          ...payload,
          error: error.code
        };
      }

      if (deployedTo) {
        payload = {
          ...payload,
          deployedTo
        };
      }

      this.track(eventName, payload);
    };

}


// helpers ////
function getDiagramType(tabType) {
  return find(keys(DIAGRAM_BY_TAB_TYPE), function(diagramType) {
    return DIAGRAM_BY_TAB_TYPE[diagramType].includes(tabType);
  });
}