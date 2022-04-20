/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getEngineProfile } from '../Util';

const types = {
  BPMN: 'bpmn',
  DMN: 'dmn',
  CMMN: 'cmmn',
  FORM: 'form'
};
export default class TabEventHandler {
  constructor(props) {

    const {
      subscribe,
      track
    } = props;

    this.track = track;

    this.subscribeToTabEvents(subscribe);
  }

  subscribeToTabEvents = (subscribe) => {

    subscribe('bpmn.modeler.created', async (event) => {
      await this.trackDiagramOpened(types.BPMN, event);
    });

    subscribe('dmn.modeler.created', async (event) => {
      await this.trackDiagramOpened(types.DMN, event);
    });

    subscribe('form.modeler.created', async (event) => {

      const {
        tab
      } = event;

      const {
        file
      } = tab;

      const {
        contents
      } = file;

      let engineProfile;

      if (contents) {
        try {
          const schema = (JSON.parse(contents));

          const {
            executionPlatform,
            executionPlatformVersion
          } = schema;

          if (executionPlatform) {

            engineProfile = executionPlatformVersion ?
              { executionPlatform: executionPlatform, executionPlatformVersion: executionPlatformVersion }
              : { executionPlatform: executionPlatform };
          }

        } catch (error) {
          return;
        }
      }

      await this.trackDiagramOpened(types.FORM, event, engineProfile);

    });

    subscribe('tab.closed', (e) => {
      this.track('diagram:closed');
    });
  }

  trackDiagramOpened = async (diagramType, { tab }, engineProfile) => {
    engineProfile = engineProfile ? engineProfile : await getEngineProfile(tab);
    let payload = { diagramType };

    if (engineProfile) {
      payload = {
        ...payload,
        ...engineProfile
      };
    }

    this.track('diagram:opened', payload);
  };

}