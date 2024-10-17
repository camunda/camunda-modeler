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
import WellKnownAPI from '../WellKnownAPI';


describe('<WellKnownAPI>', function() {

  /**
   * @type {sinon.SinonStub<fetch>}
   */
  let fetchSpy;

  beforeEach(function() {
    fetchSpy = sinon.stub(window, 'fetch');
  });

  afterEach(function() {
    fetchSpy.restore();
  });

  describe('#getWellKnownWebAppUrls', function() {

    it('should retrieve well known urls', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({
        json: () => ({
          'adminUrl': 'http://localhost:18080/camunda/apps/admin/default/#/',
          'tasklistUrl': 'http://localhost:18080/camunda/apps/tasklist/default/#/',
          'cockpitUrl': 'http://localhost/camunda/apps/cockpit/default/#/'
        }),
      }));

      // when
      const wellKnownUrls = await api.getWellKnownWebAppUrls();

      // then
      expectFetched(fetchSpy);
      expect(wellKnownUrls).to.have.property('admin', 'http://localhost:18080/camunda/apps/admin/default/#/');
      expect(wellKnownUrls).to.have.property('tasklist', 'http://localhost:18080/camunda/apps/tasklist/default/#/');
      expect(wellKnownUrls).to.have.property('cockpit', 'http://localhost/camunda/apps/cockpit/default/#/');
    });


    it('should throw when fetch fails', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.rejects(new ConnectionError('Failed to fetch'));

      // when
      let error;

      try {
        await api.getWellKnownWebAppUrls();
      } catch (e) {
        error = e;
      } finally {
        expectFetched(fetchSpy);
        expect(error).to.exist;
      }
    });


    it('should throw when response is not ok', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({ ok: false }));

      // when
      let error;

      try {
        await api.getWellKnownWebAppUrls();
      } catch (e) {
        error = e;
      } finally {

        // then
        expectFetched(fetchSpy);
        expect(error).to.exist;
      }
    });


    it('should handle failed response with non-JSON body', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({
        ok: false,
        status: 401,
        json: () => JSON.parse('401 Unauthorized')
      }));

      // when
      let error;

      try {
        await api.getWellKnownWebAppUrls();
      } catch (e) {
        error = e;
      } finally {

        // then
        expectFetched(fetchSpy);
        expect(error).to.exist;
      }
    });


    describe('timeout handling', function() {

      let clock;

      before(function() {
        clock = sinon.useFakeTimers();
      });

      after(function() { return clock.restore(); });


      it('should abort request on timeout', async function() {

        // given
        const api = createWellKnownAPI();

        fetchSpy.callsFake((_, { signal }) => {
          return new Promise(resolve => {
            for (let i = 0; i < 10; i++) {
              if (signal && signal.aborted) {
                throw new Error('timeout');
              }

              clock.tick(2000);
            }

            resolve(new Response({
              json: () => ({
                'adminUrl': 'http://localhost:18080/camunda/apps/admin/default/#/',
                'tasklistUrl': 'http://localhost:18080/camunda/apps/tasklist/default/#/',
                'cockpitUrl': 'http://localhost/camunda/apps/cockpit/default/#/'
              }),
            }));
          });
        });

        // when
        let error;

        try {
          await api.getWellKnownWebAppUrls();
        } catch (e) {
          error = e;
        } finally {

          // then
          expectFetched(fetchSpy);
          expect(error).to.exist;
        }
      });

    });

  });

  describe('#getCockpitUrl', function() {

    it('should retrieve well known url', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({
        json: () => ({
          'cockpitUrl': 'http://localhost/camunda/apps/cockpit/default/#/'
        }),
      }));

      // when
      const resultUrl = await api.getCockpitUrl();

      // then
      expectFetched(fetchSpy);
      expect(resultUrl).to.equal('http://localhost/camunda/apps/cockpit/default/#/');
    });

    it('should add trailing slash to well known url', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({
        json: () => ({
          'cockpitUrl': 'http://localhost/camunda/apps/cockpit/default/#/'
        }),
      }));

      // when
      const resultUrl = await api.getCockpitUrl();

      // then
      expectFetched(fetchSpy);
      expect(resultUrl).to.equal('http://localhost/camunda/apps/cockpit/default/#/');
    });

    it('should add default engine to to well known url', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({
        json: () => ({
          'cockpitUrl': 'http://localhost/camunda/apps/cockpit/default/#/'
        }),
      }));

      // when
      const resultUrl = await api.getCockpitUrl();

      // then
      expectFetched(fetchSpy);
      expect(resultUrl).to.equal('http://localhost/camunda/apps/cockpit/default/#/');
    });


    it('should throw when fetch fails', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.rejects(new ConnectionError('Failed to fetch'));

      // when
      let error;

      try {
        await api.getCockpitUrl();
      } catch (e) {
        error = e;
      } finally {
        expectFetched(fetchSpy);
        expect(error).to.exist;
      }
    });


    it('should throw when response is not ok', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({ ok: false }));

      // when
      let error;

      try {
        await api.getCockpitUrl();
      } catch (e) {
        error = e;
      } finally {

        // then
        expectFetched(fetchSpy);
        expect(error).to.exist;
      }
    });


    it('should handle failed response with non-JSON body', async function() {

      // given
      const api = createWellKnownAPI();

      fetchSpy.resolves(new Response({
        ok: false,
        status: 401,
        json: () => JSON.parse('401 Unauthorized')
      }));

      // when
      let error;

      try {
        await api.getCockpitUrl();
      } catch (e) {
        error = e;
      } finally {

        // then
        expectFetched(fetchSpy);
        expect(error).to.exist;
      }
    });


    describe('timeout handling', function() {

      let clock;

      before(function() {
        clock = sinon.useFakeTimers();
      });

      after(function() { return clock.restore(); });


      it('should abort request on timeout', async function() {

        // given
        const api = createWellKnownAPI();

        fetchSpy.callsFake((_, { signal }) => {
          return new Promise(resolve => {
            for (let i = 0; i < 10; i++) {
              if (signal && signal.aborted) {
                throw new Error('timeout');
              }

              clock.tick(2000);
            }

            resolve(new Response({
              json: () => ({
                'cockpitUrl': 'http://localhost/camunda/apps/cockpit/default/#/'
              }),
            }));
          });
        });

        // when
        let error;

        try {
          await api.getCockpitUrl();
        } catch (e) {
          error = e;
        } finally {

          // then
          expectFetched(fetchSpy);
          expect(error).to.exist;
        }
      });

    });
  });
});


// helpers //////////
function Response({
  ok = true,
  status = 200,
  json = async () => {
    return {};
  }
} = {}) {
  this.ok = ok;
  this.status = status;
  this.json = json;
}


function createWellKnownAPI() {
  return new WellKnownAPI('http://localhost:18080');
}

function expectFetched(fetchSpy, expectedOptions = {}) {

  const {
    url,
    ...options
  } = expectedOptions;

  expect(fetchSpy).to.have.been.calledOnce;

  const [ argUrl, argOptions ] = fetchSpy.args[0];

  expect(fetchSpy).to.have.been.calledWith(url || argUrl, {
    ...argOptions,
    ...options
  });

}
