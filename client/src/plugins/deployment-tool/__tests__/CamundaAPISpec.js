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

import CamundaAPI from '../CamundaAPI';

const baseUrl = 'https://localhost:8080/rest-engine';


describe('<CamundaAPI>', () => {

  /**
   * @type {sinon.SinonStub<fetch>}
   */
  let fetchStub;

  /**
   * @type {CamundaAPI}
   */
  let api;

  beforeEach(() => {
    fetchStub = sinon.stub(window, 'fetch');

    api = new CamundaAPI(baseUrl);
  });

  afterEach(() => {
    fetchStub.restore();
  });


  describe('#deployDiagram', () => {

    const diagram = {
      name: 'diagram',
      contents: 'xml'
    };

    const details = {
      deploymentName: 'deployment'
    };


    it('should deploy diagram', async () => {

      // given
      fetchStub.resolves(new Response());

      // when
      const result = await api.deployDiagram(diagram, details);

      // then
      expect(result).to.exist;
    });


    it('should throw when fetch fails', async () => {

      // given
      fetchStub.rejects(new TypeError('Failed to fetch'));

      // when
      let error;

      try {
        await api.deployDiagram(diagram, details);
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should throw when response is not ok', async () => {

      // given
      fetchStub.resolves(new Response({ ok: false }));

      // when
      let error;

      try {
        await api.deployDiagram(diagram, details);
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should handle failed response with non-JSON body', async () => {

      // given
      fetchStub.resolves(new Response({
        ok: false,
        status: 401,
        json: () => JSON.parse('401 Unauthorized')
      }));

      // when
      let error;

      try {
        await api.deployDiagram(diagram, details);
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });

  });


  describe('#checkConnection', () => {

    it('should check server connection', async () => {

      // given
      fetchStub.resolves(new Response());

      // when
      await api.checkConnection();
    });


    it('should throw when fetch fails', async () => {

      // given
      fetchStub.rejects(new TypeError('Failed to fetch'));

      // when
      let error;

      try {
        await api.checkConnection();
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should throw when response is not ok', async () => {

      // given
      fetchStub.resolves(new Response({ ok: false }));

      // when
      let error;

      try {
        await api.checkConnection();
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should handle failed response with non-JSON body', async () => {

      // given
      fetchStub.resolves(new Response({
        ok: false,
        status: 401,
        json: () => JSON.parse('401 Unauthorized')
      }));

      // when
      let error;

      try {
        await api.checkConnection();
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    describe('timeout handling', () => {

      let clock;

      before(() => {
        clock = sinon.useFakeTimers();
      });

      after(() => clock.restore());


      it('should abort request on timeout', async () => {

        // given
        fetchStub.callsFake((_, { signal }) => {
          return new Promise(resolve => {
            for (let i = 0; i < 10; i++) {
              if (signal && signal.aborted) {
                throw new Error('timeout');
              }

              clock.tick(2000);
            }

            resolve(new Response());
          });
        });

        // when
        let error;

        try {
          await api.checkConnection();
        } catch (e) {
          error = e;
        } finally {

          // then
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
