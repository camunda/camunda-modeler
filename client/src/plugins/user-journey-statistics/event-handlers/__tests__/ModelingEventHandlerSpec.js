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

import { create } from 'diagram-js/lib/model';
import ModelingEventHandler from '../ModelingEventHandler';


describe('<ModelingEventHandler>', function() {

  let subscribe, track;

  beforeEach(function() {

    subscribe = sinon.spy();

    track = sinon.spy();

    new ModelingEventHandler({
      track,
      subscribe
    });
  });


  describe('should subscribe', function() {

    it('should subscribe to bpmn.modeler.created', function() {
      expect(subscribe.getCall(0).args[0]).to.eql('bpmn.modeler.created');
    });


    it('should subscribe to telemetry.enabled', function() {
      expect(subscribe.getCall(1).args[0]).to.eql('telemetry.enabled');
    });


    it('should subscribe to telemetry.disabled', function() {
      expect(subscribe.getCall(2).args[0]).to.eql('telemetry.disabled');
    });

  });


  describe('should track modeling events', function() {

    const { subscribe, callSubscriber } = createSubscribe();

    beforeEach(function() {
      track = sinon.spy();

      new ModelingEventHandler({
        track,
        subscribe
      });

    });

    it('shoud subscribe to bpmnJSTracking events', function() {

      const onSpy = sinon.spy();

      callSubscriber({ on: onSpy });

      expect(onSpy).to.have.been.calledWith('tracking.event');
    });


    it('shoud track bpmnJSTracking events', function() {

      callSubscriber({
        on: (_, callback) => {
          callback({ name: '', data: {} });
        }
      });

      expect(track).to.have.been.called;
    });


    describe('should transform data', function() {

      it('diagram elements', function() {

        callSubscriber({
          on: (_, callback) => {
            callback({
              name: 'some.event',
              data: {
                nonAnElement: 'someValue',
                element: create('shape'),
                elementArray: [ create('shape') ]
              }
            });
          }
        });

        expect(track).to.have.been.calledWith('some:event', {
          nonAnElement: 'someValue',
          element: {},
          elementArray: [ {} ]
        });
      });


      describe('popupmenu.trigger - element templates id', function() {

        const subscribeToPopupTrigger = (id) => {
          callSubscriber({
            on: (_, callback) => {
              callback({
                name: 'popupMenu.trigger',
                data: {
                  entryId: id
                }
              });
            }
          });
        };

        it('append', function() {

          // when
          subscribeToPopupTrigger('append.template-id');

          // then
          expect(track).to.have.been.calledWith('popupMenu:trigger', {
            entryId: 'append.template-id',
            templateId: 'id'
          });
        });


        it('replace', function() {

          // when
          subscribeToPopupTrigger('replace.template-id');

          // then
          expect(track).to.have.been.calledWith('popupMenu:trigger', {
            entryId: 'replace.template-id',
            templateId: 'id'
          });
        });


        it('create', function() {

          // when
          subscribeToPopupTrigger('create.template-id');

          // then
          expect(track).to.have.been.calledWith('popupMenu:trigger', {
            entryId: 'create.template-id',
            templateId: 'id'
          });
        });

      });
    });
  });
});


// helpers ///////////////
function createSubscribe() {
  let callback = null;

  function subscribe(_event, _callback) {
    if ('bpmn.modeler.created' === _event) {
      callback = _callback;
    }

    return function cancel() {
      callback = null;
    };
  }

  function callSubscriber(args) {
    if (callback) {

      callback({
        modeler: {
          get: () => {
            return {
              enable: () => {},
              disable: () => {},
              on: () => {},
              ...args
            };
          }
        }
      });
    }
  }

  return {
    callSubscriber,
    subscribe
  };
}

