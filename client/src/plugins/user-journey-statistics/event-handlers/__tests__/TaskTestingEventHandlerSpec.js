/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import MixpanelHandler from '../../MixpanelHandler';

import TaskTestingEventHandler from '../TaskTestingEventHandler';

describe('<TaskTestingEventHandler>', function() {

  let subscribe, track;

  beforeEach(function() {

    subscribe = sinon.spy();

    track = sinon.spy();

    new TaskTestingEventHandler({
      track,
      subscribe
    });

    MixpanelHandler.getInstance().enable('token', 'id', 'stage');
  });


  describe('should subscribe', function() {

    it('should subscribe to taskTesting.started', function() {

      // then
      expect(subscribe.getCall(0).args[0]).to.eql('taskTesting.started');
    });


    it('should subscribe to taskTesting.finished', function() {

      // then
      expect(subscribe.getCall(1).args[0]).to.eql('taskTesting.finished');
    });
  });


  describe('should track', function() {

    it('should track taskTesting:started', function() {

      // when
      const event = {
        element: {
          id: 'Activity_1',
          businessObject: {
            $type: 'bpmn:UserTask',
            modelerTemplate: 'someTemplate'
          }
        }
      };

      subscribe.getCall(0).args[1](event);

      // then
      expect(track).to.have.been.calledWith('taskTesting:started', {
        elementType: 'bpmn:UserTask',
        elementTemplate: 'someTemplate'
      });
    });

    it('should track taskTesting:finished', function() {

      // when
      const event = {
        element: {
          id: 'Activity_1',
          businessObject: {
            $type: 'bpmn:UserTask',
            modelerTemplate: 'someTemplate'
          }
        },
        output: {
          success: false,
          incident: {
            errorType: 'INCIDENT_TYPE'
          }
        }
      };

      subscribe.getCall(1).args[1](event);

      // then
      expect(track).to.have.been.calledWith('taskTesting:finished', {
        elementType: 'bpmn:UserTask',
        elementTemplate: 'someTemplate',
        success: false,
        incidentType: 'INCIDENT_TYPE'
      });
    });

  });
});