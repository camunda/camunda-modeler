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


describe('<CamundaAPI>', function() {

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


  describe('#deployDiagram', function() {

    const diagram = {
      name: 'diagram',
      contents: 'xml'
    };

    const deployment = {
      name: 'TEST NAME'
    };


    it('should deploy diagram', async function() {

      // given
      const api = createCamundaAPI({
        url: 'http://foo'
      });

      // when
      fetchSpy.resolves(new Response());

      const result = await api.deployDiagram(diagram, deployment);

      // then
      expect(result).to.exist;

      expectFetched(fetchSpy, {
        url: 'http://foo/deployment/create'
      });
    });


    it('should deploy diagram with tenant ID', async function() {

      // given
      const deployment = {
        name: 'FOO',
        tenantId: '111'
      };

      const api = createCamundaAPI();

      fetchSpy.resolves(new Response());

      // when
      const result = await api.deployDiagram(diagram, deployment);

      // then
      expect(result).to.exist;
    });


    it('should deploy with basic auth', async function() {

      // given
      const api = createCamundaAPI({
        username: 'FOO',
        password: 'BAR',
        authType: 'basic'
      });

      fetchSpy.resolves(new Response());

      // when
      const result = await api.deployDiagram(diagram, deployment);

      // then
      expect(result).to.exist;

      expectFetched(fetchSpy, {
        headers: {
          accept: 'application/json',
          authorization: 'Basic Rk9POkJBUg=='
        }
      });
    });


    it('should deploy with bearer token', async function() {

      // given
      const api = createCamundaAPI({
        token: 'FOO',
        authType: 'bearer'
      });

      fetchSpy.resolves(new Response());

      // when
      const result = await api.deployDiagram(diagram, deployment);

      // then
      expect(result).to.exist;

      expectFetched(fetchSpy, {
        headers: {
          accept: 'application/json',
          authorization: 'Bearer FOO'
        }
      });
    });


    it('should deploy with attachments', async function() {

      // given
      const api = createCamundaAPI();
      const attachments = [ new File([], 'first'), new File([], 'second') ];

      fetchSpy.resolves(new Response());

      // when
      const result = await api.deployDiagram(diagram, { ...deployment, attachments });

      // then
      expect(result).to.exist;

      const formData = fetchSpy.getCall(0).args[1].body;
      expect(formData.get('first')).to.exist;
      expect(formData.get('second')).to.exist;
    });


    it('should throw when fetch fails', async function() {

      // given
      const api = createCamundaAPI();

      // when
      fetchSpy.rejects(new TypeError('Failed to fetch'));

      // when
      let error;

      try {
        await api.deployDiagram(diagram, deployment);
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should throw when response is not ok', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({ ok: false }));

      // when
      let error;

      try {
        await api.deployDiagram(diagram, deployment);
      } catch (e) {
        error = e;
      }

      // then
      expect(error).to.exist;
    });


    it('should handle failed response with non-JSON body', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({
        ok: false,
        status: 401,
        json: () => JSON.parse('401 Unauthorized')
      }));

      // when
      let error;

      try {
        await api.deployDiagram(diagram, deployment);
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should deploy with correct flags', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response());

      // when
      const result = await api.deployDiagram(diagram, deployment);

      // then
      expect(result).to.exist;

      const formData = fetchSpy.getCall(0).args[1].body;
      expect(formData.get('deploy-changed-only')).not.to.exist;
      expect(formData.get('enable-duplicate-filtering')).to.equal('true');
    });

  });


  describe('#checkConnection', function() {

    it('should check server connection', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response());

      // when
      await api.checkConnection();
    });


    it('should throw when fetch fails', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.rejects(new TypeError('Failed to fetch'));

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


    it('should throw when response is not ok', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({ ok: false }));

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


    it('should handle failed response with non-JSON body', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({
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


    describe('timeout handling', function() {

      let clock;

      before(function() {
        clock = sinon.useFakeTimers();
      });

      after(function() { return clock.restore(); });


      it('should abort request on timeout', async function() {

        // given
        const api = createCamundaAPI();

        fetchSpy.callsFake((_, { signal }) => {
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


  describe('#getVersion', function() {

    it('should return server version', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({
        ok: true,
        status: 200,
        json: () => { return {
          version: '7.15.0'
        }; }
      }));

      // when
      const { version } = await api.getVersion();

      // then
      expect(version).to.eql('7.15.0');
    });


    it('should return undefined if version cannot be parsed', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({
        ok: true,
        status: 200,
        json: () => { return { }; }
      }));

      // when
      const { version } = await api.getVersion();

      // then
      expect(version).to.be.undefined;
    });


    it('should throw when fetch fails', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.rejects(new TypeError('Failed to fetch'));

      // when
      let error;

      try {
        await api.getVersion();
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should throw when response is not ok', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({ ok: false }));

      // when
      let error;

      try {
        await api.getVersion();
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should handle failed response with non-JSON body', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({
        ok: false,
        status: 401,
        json: () => JSON.parse('401 Unauthorized')
      }));

      // when
      let error;

      try {
        await api.getVersion();
      } catch (e) {
        error = e;
      } finally {

        // then
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
        const api = createCamundaAPI();

        fetchSpy.callsFake((_, { signal }) => {
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
          await api.getVersion();
        } catch (e) {
          error = e;
        } finally {

          // then
          expect(error).to.exist;
        }
      });

    });

  });


  describe('#startInstance', function() {

    const processDefinition = {
      id: 'processDefinition'
    };

    const options = {
      businessKey: 'businessKey'
    };

    it('should start process', async function() {

      // given
      const api = createCamundaAPI({
        url: 'http://foo'
      });

      // when
      fetchSpy.resolves(new Response());

      const result = await api.startInstance(processDefinition, options);

      // then
      expect(result).to.exist;

      expectFetched(fetchSpy, {
        url: 'http://foo/process-definition/processDefinition/start'
      });
    });


    it('should throw when fetch fails', async function() {

      // given
      const api = createCamundaAPI();

      // when
      fetchSpy.rejects(new TypeError('Failed to fetch'));

      // when
      let error;

      try {
        await api.startInstance(processDefinition, options);
      } catch (e) {
        error = e;
      } finally {

        // then
        expect(error).to.exist;
      }
    });


    it('should throw when response is not ok', async function() {

      // given
      const api = createCamundaAPI();

      fetchSpy.resolves(new Response({ ok: false }));

      // when
      let error;

      try {
        await api.startInstance(processDefinition, options);
      } catch (e) {
        error = e;
      }

      // then
      expect(error).to.exist;
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


function createCamundaAPI(props = {}) {

  return new CamundaAPI({
    url: 'http://localhost:3000/engine-rest',
    ...props
  });

}

function expectFetched(fetchSpy, expectedOptions) {

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
