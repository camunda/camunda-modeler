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

export const LAYOUT_CHANGED_EVENT_NAME = 'formEditor:layoutChanged';
export const INPUT_DATA_CHANGED_EVENT_NAME = 'formEditor:inputDataChanged';
export const PREVIEW_CHANGED_EVENT_NAME = 'formEditor:previewChanged';


export default class FormEditorEventHandler {
  constructor(props) {

    const {
      subscribe,
      track
    } = props;

    this.track = track;

    this.subscribeToEditorEvents(subscribe);
  }

  subscribeToEditorEvents = (subscribe) => {
    subscribe('form.modeler.playgroundLayoutChanged', this.trackLayoutChanges);
    subscribe('form.modeler.inputDataChanged', this.trackInputDataChanges);
    subscribe('form.modeler.previewChanged', this.trackPreviewChanges);
  };

  trackLayoutChanges = async (event) => {
    const {
      layout,
      tab,
      triggeredBy
    } = event;

    let payload = {
      layout
    };

    if (triggeredBy) {
      payload = {
        ...payload,
        triggeredBy
      };
    }

    this.trackWithEngineProfile(tab, LAYOUT_CHANGED_EVENT_NAME, payload);
  };

  trackInputDataChanges = async (event) => {
    const {
      tab
    } = event;

    let payload = {};

    this.trackWithEngineProfile(tab, INPUT_DATA_CHANGED_EVENT_NAME, payload);
  };

  trackPreviewChanges = async (event) => {
    const {
      tab
    } = event;

    let payload = {};

    this.trackWithEngineProfile(tab, PREVIEW_CHANGED_EVENT_NAME, payload);
  };

  trackWithEngineProfile = async (tab, eventName, payload) => {
    const {
      file
    } = tab;

    const {
      contents
    } = file;

    const engineProfile = await getEngineProfile(contents, 'form');

    if (engineProfile) {
      payload = {
        ...payload,
        ...engineProfile
      };
    }

    this.track(eventName, payload);
  };

}