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
  getResourceType,
  getTemplateIds
} from '../util';

import {
  getEngineProfile
} from '../../../util/parse';

import {
  CONTEXT_TO_EVENT
} from '../util';

export default class DeploymentEventHandler {
  constructor(props) {

    const {
      subscribe,
      track
    } = props;

    this.track = track;
    this.modeler = null;

    this.subscribeToDeploymentEvents(subscribe);
    this.handleBpmnModelerConfigure(subscribe);
  }

  handleBpmnModelerConfigure = (subscribe) => {

    subscribe('bpmn.modeler.created', (event) => {
      this.modeler = event.modeler;
    });

  };

  subscribeToDeploymentEvents = (subscribe) => {

    subscribe('deployment.done', async (event) => {
      const { tab } = event;
      const type = getResourceType(tab.type);

      await this.trackDeploymentAction(type, true, event);
    });

    subscribe('deployment.error', async (event) => {
      const { tab } = event;
      const type = getResourceType(tab.type);

      await this.trackDeploymentAction(type, false, event);
    });

  };

  trackDeploymentAction = async (resourceType, success, event) => {
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

    if (!resourceType) {
      return;
    }

    const baseEvent = CONTEXT_TO_EVENT[context];
    const outcome = success ? 'success' : 'error';

    const eventName = baseEvent + ':' + outcome;

    const engineProfile = await getEngineProfile(contents, resourceType);

    let payload = {
      diagramType: resourceType, // legacy
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

    const templateIds = getTemplateIds(this.modeler);

    if (templateIds.length) {
      payload = {
        ...payload,
        templateIds
      };
    }

    this.track(eventName, payload);
  };

}
