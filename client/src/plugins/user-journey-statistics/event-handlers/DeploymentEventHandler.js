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
  getEngineProfile,
  getDiagramType
} from '../Util';

export default class EventHandler {
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

    if (!diagramType) {
      return;
    }

    const baseEvent = context === 'deploymentTool' ? 'deploy' : 'startInstance';
    const outcome = success ? 'success' : 'error';

    const eventName = baseEvent + ':' + outcome;

    const engineProfile = await getEngineProfile(tab);

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

