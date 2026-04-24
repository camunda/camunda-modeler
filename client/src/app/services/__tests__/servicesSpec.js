/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import createDefaultServices from '../createDefaultServices';
import ActionRegistry from '../ActionRegistry';


describe('services', function() {


  describe('createDefaultServices', function() {

    it('should create layout, notification and linting services', function() {

      // given
      const deps = {
        setState: sinon.spy(),
        getState: () => ({ layout: {} }),
        tabsProvider: { getProvider: () => ({ getLinter: () => null }) },
        getPlugins: () => [],
        getConfig: () => ({})
      };

      // when
      const services = createDefaultServices(deps);

      // then
      expect(services.layout).to.exist;
      expect(services.notification).to.exist;
      expect(services.linting).to.exist;
    });


    it('should wire notification to layout.openPanel', function() {

      // given
      const state = { layout: {}, notifications: [], logEntries: [] };

      const deps = {
        setState: (updater) => {
          const patch = typeof updater === 'function' ? updater(state) : updater;
          Object.assign(state, patch);
        },
        getState: () => state,
        tabsProvider: { getProvider: () => ({ getLinter: () => null }) },
        getPlugins: () => [],
        getConfig: () => ({})
      };

      const services = createDefaultServices(deps);

      const openPanelSpy = sinon.spy(services.layout, 'openPanel');

      // when
      services.notification.logEntry('test message', 'info');

      // then — notification called layout.openPanel
      expect(openPanelSpy).to.have.been.calledWith('log');
    });

  });

});
