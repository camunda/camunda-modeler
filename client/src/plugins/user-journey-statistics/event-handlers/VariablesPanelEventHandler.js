/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { DEFAULT_OPEN } from '../../../app/tabs/cloud-bpmn/variables-side-panel/VariablesSidePanel';

export const VARIABLE_OUTLINE_OPENED_EVENT_NAME = 'variableOutline:opened';
export const VARIABLE_OUTLINE_CLOSED_EVENT_NAME = 'variableOutline:closed';


export default class VariablesPanelEventHandler {
  constructor(props) {

    const {
      subscribe,
      track
    } = props;

    this.track = track;

    subscribe('layout.changed', ({ prevLayout, layout }) => {
      const wasOpen = prevLayout?.variablesSidePanel?.open ?? DEFAULT_OPEN;
      const isOpen = layout?.variablesSidePanel?.open ?? DEFAULT_OPEN;

      if (wasOpen !== isOpen) {
        this.track(isOpen ? VARIABLE_OUTLINE_OPENED_EVENT_NAME : VARIABLE_OUTLINE_CLOSED_EVENT_NAME);
      }
    });
  }
}
