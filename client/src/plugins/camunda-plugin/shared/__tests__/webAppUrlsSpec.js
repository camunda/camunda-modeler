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

import { ConnectionError } from '../RestAPI';
import { determineCockpitUrl } from '../webAppUrls';
import WellKnownAPI from '../WellKnownAPI';

let getCockpitUrlStub;

describe('<webAppUrls>', function() {

  function stubGetCockpitUrl() {
    getCockpitUrlStub = sinon.stub(WellKnownAPI.prototype, 'getCockpitUrl');
    return getCockpitUrlStub;
  }

  afterEach(function() {
    getCockpitUrlStub.restore();
  });


  describe('reachable well known api', function() {
    it('should return specific Cockpit link', async function() {

      // given
      stubGetCockpitUrl().returns('http://localhost:18080/camunda/app/cockpit/default/#/');

      // when
      const cockpitUrl = await determineCockpitUrl('http://localhost:18080/camunda/rest');

      // then
      expect(cockpitUrl).to.be.equal('http://localhost:18080/camunda/app/cockpit/default/#/');
    });


    it('should return default for missing Cockpit link', async function() {

      // given
      stubGetCockpitUrl().returns(undefined);

      // when
      const cockpitUrl = await determineCockpitUrl('http://localhost:8080/camunda/rest');

      // then
      expect(cockpitUrl).to.be.equal('http://localhost:8080/app/cockpit/default/#/');
    });


    it('should return default for empty Cockpit link', async function() {

      // given
      stubGetCockpitUrl().returns('');

      // when
      const cockpitUrl = await determineCockpitUrl('http://localhost:8080/camunda/rest');

      // then
      expect(cockpitUrl).to.be.equal('http://localhost:8080/app/cockpit/default/#/');
    });
  });


  describe('unreachable well known api', function() {

    beforeEach(function() {
      stubGetCockpitUrl().throws(new ConnectionError({ ok: false, status: 404 }));
    });


    it('should return Spring-specific Cockpit link', async function() {

      // given
      const engineRestUrl = 'http://localhost:8080/rest';

      // when
      const cockpitUrl = await determineCockpitUrl(engineRestUrl);

      // then
      expect(cockpitUrl).to.be.equal('http://localhost:8080/app/cockpit/default/#/');
    });


    it('should return Tomcat-specific Cockpit link', async function() {

      // given
      const engineRestUrl = 'http://localhost:8080/engine-rest';

      // when
      const cockpitUrl = await determineCockpitUrl(engineRestUrl);

      // then
      expect(cockpitUrl).to.be.equal('http://localhost:8080/camunda/app/cockpit/default/#/');
    });


    it('should return Spring-specific Cockpit link for custom rest url', async function() {

      // given
      const engineRestUrl = 'http://customized-camunda.bpmn.io/custom-rest';

      // when
      const cockpitUrl = await determineCockpitUrl(engineRestUrl);

      // then
      expect(cockpitUrl).to.be.equal('http://customized-camunda.bpmn.io/app/cockpit/default/#/');
    });
  });
});
