/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import NotificationService from '../NotificationService';
import ActionRegistry from '../ActionRegistry';


describe('NotificationService', function() {

  function createNotificationService(options = {}) {
    const state = { notifications: [], logEntries: [], ...options.initialState };
    const openPanelSpy = sinon.spy();

    const service = new NotificationService({
      setState: (updater) => {
        const patch = typeof updater === 'function' ? updater(state) : updater;
        Object.assign(state, patch);
      },
      getState: () => state,
      openPanel: openPanelSpy
    });

    return { service, state, openPanelSpy };
  }


  describe('#displayNotification', function() {

    it('should add notification', function() {

      // given
      const { service, state } = createNotificationService();

      // when
      service.displayNotification({ title: 'Test' });

      // then
      expect(state.notifications).to.have.length(1);
      expect(state.notifications[0].title).to.equal('Test');
      expect(state.notifications[0].type).to.equal('info');
    });


    it('should return close and update handles', function() {

      // given
      const { service } = createNotificationService();

      // when
      const result = service.displayNotification({ title: 'Test' });

      // then
      expect(result.close).to.be.a('function');
      expect(result.update).to.be.a('function');
    });


    it('should throw on unknown type', function() {

      // given
      const { service } = createNotificationService();

      // then
      expect(() => service.displayNotification({ title: 'X', type: 'invalid' }))
        .to.throw('Unknown notification type');
    });


    it('should throw on non-string title', function() {

      // given
      const { service } = createNotificationService();

      // then
      expect(() => service.displayNotification({ title: 123 }))
        .to.throw('Title should be string');
    });

  });


  describe('#closeNotifications', function() {

    it('should clear all notifications', function() {

      // given
      const { service, state } = createNotificationService();
      service.displayNotification({ title: 'A' });
      service.displayNotification({ title: 'B' });

      // when
      service.closeNotifications();

      // then
      expect(state.notifications).to.have.length(0);
    });

  });


  describe('notification close/update', function() {

    it('should close individual notification', function() {

      // given
      const { service, state } = createNotificationService();
      const { close } = service.displayNotification({ title: 'To remove' });
      service.displayNotification({ title: 'Keep' });

      // when
      close();

      // then
      expect(state.notifications).to.have.length(1);
      expect(state.notifications[0].title).to.equal('Keep');
    });


    it('should update individual notification', function() {

      // given
      const { service, state } = createNotificationService();
      const { update } = service.displayNotification({ title: 'Old' });

      // when
      update({ title: 'New' });

      // then
      expect(state.notifications[0].title).to.equal('New');
    });

  });


  describe('#logEntry', function() {

    it('should add log entry and open panel', function() {

      // given
      const { service, state, openPanelSpy } = createNotificationService();

      // when
      service.logEntry('Test message', 'test-category');

      // then
      expect(state.logEntries).to.have.length(1);
      expect(state.logEntries[0].message).to.equal('Test message');
      expect(state.logEntries[0].category).to.equal('test-category');
      expect(openPanelSpy).to.have.been.calledWith('log');
    });


    it('should add log entry silently', function() {

      // given
      const { service, openPanelSpy } = createNotificationService();

      // when
      service.logEntry('Silent', 'cat', null, true);

      // then
      expect(openPanelSpy).not.to.have.been.called;
    });


    it('should include action if provided', function() {

      // given
      const { service, state } = createNotificationService();
      const action = sinon.spy();

      // when
      service.logEntry('msg', 'cat', action);

      // then
      expect(state.logEntries[0].action).to.equal(action);
    });

  });


  describe('#clearLog', function() {

    it('should clear log entries', function() {

      // given
      const { service, state } = createNotificationService();
      service.logEntry('msg', 'cat', null, true);

      // when
      service.clearLog();

      // then
      expect(state.logEntries).to.have.length(0);
    });

  });


  describe('#registerActions', function() {

    it('should register log action', function() {

      // given
      const { service } = createNotificationService();
      const actionRegistry = new ActionRegistry();
      const logEntrySpy = sinon.spy(service, 'logEntry');

      // when
      service.registerActions(actionRegistry);
      actionRegistry.dispatch('log', {
        message: 'hello', category: 'test', action: null, silent: false
      });

      // then
      expect(logEntrySpy).to.have.been.calledWith('hello', 'test', null, false);
    });


    it('should register display-notification action', function() {

      // given
      const { service } = createNotificationService();
      const actionRegistry = new ActionRegistry();
      const displaySpy = sinon.spy(service, 'displayNotification');

      // when
      service.registerActions(actionRegistry);
      actionRegistry.dispatch('display-notification', { title: 'Test' });

      // then
      expect(displaySpy).to.have.been.calledWith({ title: 'Test' });
    });

  });

});
