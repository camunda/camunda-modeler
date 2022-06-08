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
  getDiagramType
} from '../util';

import {
  getEngineProfile
} from '../../../util/parse';

export default class UIEventHandler {
  constructor(props) {

    const {
      subscribe,
      track
    } = props;

    this.track = track;

    this.subscribeEvents(subscribe);
  }

    subscribeEvents = (subscribe) => {

      // deploy
      subscribe('deployment.opened', async (event) => {
        const { tab } = event;
        const type = getDiagramType(tab.type);

        await this.trackDeploymentOverlay(type, 'opened', event);
      });

      subscribe('deployment.closed', async (event) => {
        const { tab } = event;
        const type = getDiagramType(tab.type);

        await this.trackDeploymentOverlay(type, 'closed', event);
      });

      // version info
      subscribe('versionInfo.opened', async ({ source }) => {
        await this.track('overlay:versionInfo:opened', {
          source
        });
      });
    }

    trackDeploymentOverlay = async (diagramType, action, event) => {

      const {
        context,
        tab
      } = event;

      const {
        file
      } = tab;

      const {
        contents
      } = file;

      const baseEvent = context === 'deploymentTool' ? 'deploy' : 'startInstance';
      const eventName = `overlay:${baseEvent}:${action}`;

      const engineProfile = await getEngineProfile(contents, diagramType);

      this.track(eventName, {
        diagramType,
        ...engineProfile
      });
    };

}
