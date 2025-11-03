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
  parseFormFieldCounts
} from '../../../util/parse';

import { getTemplateIds } from '../util';

import debug from 'debug';
const log = debug('TabEventHandler');

const types = {
  BPMN: 'bpmn',
  DMN: 'dmn',
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

      let payload = { diagramType: type };

      if (engineProfile) {
        payload = {
          ...payload,
          ...engineProfile
        };
      }

      if (type === types.FORM) {
        payload = {
          ...payload,
          formFieldTypes: parseFormFieldCounts(contents)
        };
      }

      this.track('diagram:closed', payload);
    });
  };

  trackDiagramOpened = async (resourceType, { tab }, engineProfile) => {

    const {
      file
    } = tab;

    const {
      contents
    } = file;

    engineProfile = await getEngineProfile(contents, resourceType);

    let payload = { diagramType: resourceType }; // legacy

    if (engineProfile) {
      payload = {
        ...payload,
        ...engineProfile
      };
    }

    try {
      await this.waitForImportDone(this.modeler);
      const templateIds = getTemplateIds(this.modeler);


      payload = {
        ...payload,
        templateIds
      };
    } catch (error) {
      log('Error getting templateIds, tracking without templateIds', error);
    }

    this.track('diagram:opened', payload);
  };


  /**
   * waits for the diagram to be completely imported or times out after 5 seconds
   */
  waitForImportDone = (modeler) => {
    const eventBus = modeler.get('eventBus');

    const importDonePromise = new Promise((resolve) => {
      eventBus.once('import.done', resolve);
    });

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });

    return Promise.race([ importDonePromise, timeoutPromise ]);
  };
}
