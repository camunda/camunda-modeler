/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

export default class TaskTestingEventHandler {
  constructor(props) {

    const {
      track,
      subscribe
    } = props;

    this.track = track;

    subscribe('taskTesting.started', (event) => {
      this.trackTaskTestingStarted(event);
    });

    subscribe('taskTesting.finished', (event) => {
      this.trackTaskTestingFinished(event);
    });
  }

  trackTaskTestingStarted(event) {
    const { element } = event;

    const { $type: type, modelerTemplate } = getBusinessObject(element);

    this.track('taskTesting:started', {
      elementType: type,
      elementTemplate: modelerTemplate,
    });
  }

  trackTaskTestingFinished(event) {
    const { element, output } = event;

    const { $type: type, modelerTemplate } = getBusinessObject(element);

    this.track('taskTesting:finished', {
      elementType: type,
      elementTemplate: modelerTemplate,
      success: output.success,
      incidentType: output.incident?.errorType
    });
  }
}