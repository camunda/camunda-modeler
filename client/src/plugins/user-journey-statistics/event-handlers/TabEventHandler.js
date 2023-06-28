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
  getEngineProfile
} from '../../../util/parse';

import { getTemplateIds } from '../util';

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
    this.modeler = null;

    this.subscribeToTabEvents(subscribe);
  }

  subscribeToTabEvents = (subscribe) => {

    subscribe('bpmn.modeler.created', async (event) => {
      this.modeler = event.modeler;

      await this.trackDiagramOpened(types.BPMN, event);
    });

    subscribe('dmn.modeler.created', async (event) => {
      await this.trackDiagramOpened(types.DMN, event);
    });

    subscribe('form.modeler.created', async (event) => {
      await this.trackDiagramOpened(types.FORM, event);
    });

    subscribe('tab.closed', async (event) => {
      const { tab } = event;

      const {
        file,
        type
      } = tab;

      const {
        contents
      } = file;

      const engineProfile = await getEngineProfile(contents, type);

      let payload = { diagramType: tab.type };

      if (engineProfile) {
        payload = {
          ...payload,
          ...engineProfile
        };
      }

      this.track('diagram:closed', payload);
    });
  };

  trackDiagramOpened = async (diagramType, { tab }, engineProfile) => {

    const {
      file
    } = tab;

    const {
      contents
    } = file;

    engineProfile = await getEngineProfile(contents, diagramType);

    let payload = { diagramType };

    if (engineProfile) {
      payload = {
        ...payload,
        ...engineProfile
      };
    }

    const templateIds = getTemplateIds(this.modeler);

    if (templateIds.length) {
      payload = {
        ...payload,
        templateIds
      };
    }

    this.track('diagram:opened', payload);
  };

}