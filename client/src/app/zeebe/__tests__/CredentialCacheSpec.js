/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import CredentialCache from '../CredentialCache';

const ENDPOINT = { id: 'cluster-a' };

const OTHER_ENDPOINT = { id: 'cluster-b' };

const TEMPLATE = 't1';


describe('CredentialCache', function() {

  describe('#getCredentials', function() {

    it('should fetch the credential source once per connection + template', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      // when
      const first = await cache.getCredentials(ENDPOINT, TEMPLATE);
      const second = await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then
      expect(first.success).to.be.true;
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
      expect(second).to.equal(first);
    });


    it('should filter by credential kind and configuration template', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      // when
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then
      expect(zeebeApi.searchClusterVariables).to.have.been.calledWithMatch({ endpoint: ENDPOINT }, {
        metadata: {
          kind: { '$eq': 'CREDENTIAL' },
          configurationTemplate: { '$eq': TEMPLATE }
        }
      });
    });


    it('should fetch each template separately', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      // when
      await cache.getCredentials(ENDPOINT, 't1');
      await cache.getCredentials(ENDPOINT, 't2');

      // then
      expect(zeebeApi.searchClusterVariables).to.have.been.calledTwice;
    });


    it('should coalesce concurrent requests into a single fetch', async function() {

      // given
      let resolveSearch;
      const searchClusterVariables = sinon.stub().returns(new Promise(resolve => {
        resolveSearch = resolve;
      }));
      const zeebeApi = createZeebeApi({ searchClusterVariables });
      const cache = new CredentialCache(zeebeApi);

      // when
      const first = cache.getCredentials(ENDPOINT, TEMPLATE);
      const second = cache.getCredentials(ENDPOINT, TEMPLATE);

      resolveSearch({ success: true, response: { items: [] } });

      // then
      expect(await first).to.equal(await second);
      expect(searchClusterVariables).to.have.been.calledOnce;
    });


    it('should page through all results', async function() {

      // given
      const searchClusterVariables = sinon.stub();
      searchClusterVariables.onFirstCall().resolves({
        success: true,
        response: { items: [ { name: 'CRED_A' } ], page: { endCursor: 'page-2' } }
      });
      searchClusterVariables.onSecondCall().resolves({
        success: true,
        response: { items: [ { name: 'CRED_B' } ], page: {} }
      });

      const zeebeApi = createZeebeApi({ searchClusterVariables });
      const cache = new CredentialCache(zeebeApi);

      // when
      const result = await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then
      expect(result.response.items.map(item => item.name)).to.eql([ 'CRED_A', 'CRED_B' ]);
      expect(searchClusterVariables.secondCall.args[2]).to.eql({ after: 'page-2', limit: 100 });
    });


    it('should not cache a failed search', async function() {

      // given
      const searchClusterVariables = sinon.stub();
      searchClusterVariables.onFirstCall().resolves({ success: false, status: 500 });
      searchClusterVariables.onSecondCall().resolves({ success: true, response: { items: [] } });

      const zeebeApi = createZeebeApi({ searchClusterVariables });
      const cache = new CredentialCache(zeebeApi);

      // when
      const failed = await cache.getCredentials(ENDPOINT, TEMPLATE);
      const retried = await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then
      expect(failed.success).to.be.false;
      expect(retried.success).to.be.true;
      expect(searchClusterVariables).to.have.been.calledTwice;
    });

  });


  describe('#upsertCredential', function() {

    it('should reflect a created credential without a refetch', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // when
      cache.upsertCredential(ENDPOINT.id, { name: 'CRED_NEW', metadata: { configurationTemplate: TEMPLATE } });

      // then
      const result = await cache.getCredentials(ENDPOINT, TEMPLATE);

      expect(result.response.items.map(item => item.name)).to.include('CRED_NEW');
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
    });


    it('should replace an existing credential by name', async function() {

      // given
      const searchClusterVariables = sinon.stub().resolves({
        success: true,
        response: { items: [ { name: 'CRED_A', metadata: { configurationTemplate: TEMPLATE, version: 1 } } ] }
      });
      const zeebeApi = createZeebeApi({ searchClusterVariables });
      const cache = new CredentialCache(zeebeApi);

      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // when
      cache.upsertCredential(ENDPOINT.id, { name: 'CRED_A', metadata: { configurationTemplate: TEMPLATE, version: 2 } });

      // then
      const result = await cache.getCredentials(ENDPOINT, TEMPLATE);

      const matches = result.response.items.filter(item => item.name === 'CRED_A');

      expect(matches).to.have.length(1);
      expect(matches[0].metadata.version).to.equal(2);
    });


    it('should be a no-op when the template has no cached source', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      // when — nothing cached yet
      cache.upsertCredential(ENDPOINT.id, { name: 'CRED_NEW', metadata: { configurationTemplate: TEMPLATE } });

      // then — the next load fetches fresh; the phantom entry was not created
      const result = await cache.getCredentials(ENDPOINT, TEMPLATE);

      expect(result.response.items.map(item => item.name)).not.to.include('CRED_NEW');
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
    });

  });


  describe('#getPermissions', function() {

    it('should grant full access on a wildcard component', async function() {

      // given
      const zeebeApi = createZeebeApi({
        getCurrentUser: sinon.stub().resolves({ success: true, response: { authorizedComponents: [ '*' ] } })
      });
      const cache = new CredentialCache(zeebeApi);

      // when
      const permissions = await cache.getPermissions(ENDPOINT);

      // then
      expect(permissions).to.eql({ create: true, update: true });
      expect(zeebeApi.getAuthorizations).not.to.have.been.called;
    });


    it('should derive permissions from the authorization search', async function() {

      // given
      const zeebeApi = createZeebeApi({
        getCurrentUser: sinon.stub().resolves({ success: true, response: { authorizedComponents: [] } }),
        getAuthorizations: sinon.stub().resolves({
          success: true,
          response: { items: [ { permissionTypes: [ 'CREATE' ] } ] }
        })
      });
      const cache = new CredentialCache(zeebeApi);

      // when
      const permissions = await cache.getPermissions(ENDPOINT);

      // then
      expect(permissions).to.eql({ create: true, update: false });
    });


    it('should resolve permissions once per connection', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      // when
      await cache.getPermissions(ENDPOINT);
      await cache.getPermissions(ENDPOINT);

      // then
      expect(zeebeApi.getCurrentUser).to.have.been.calledOnce;
    });


    it('should cache a legitimate deny from a successful empty search', async function() {

      // given — authz-enabled cluster, user has no CLUSTER_VARIABLE grants
      const zeebeApi = createZeebeApi({
        getCurrentUser: sinon.stub().resolves({ success: true, response: { authorizedComponents: [] } }),
        getAuthorizations: sinon.stub().resolves({ success: true, response: { items: [] } })
      });
      const cache = new CredentialCache(zeebeApi);

      // when
      const first = await cache.getPermissions(ENDPOINT);
      const second = await cache.getPermissions(ENDPOINT);

      // then
      expect(first).to.eql({ create: false, update: false });
      expect(second).to.eql({ create: false, update: false });
      expect(zeebeApi.getAuthorizations).to.have.been.calledOnce;
    });


    it('should not cache a deny derived from a failed authorization search', async function() {

      // given — user lookup is non-full, then the authorization search fails
      const getAuthorizations = sinon.stub();
      getAuthorizations.onFirstCall().resolves({ success: false, status: 500 });
      getAuthorizations.onSecondCall().resolves({
        success: true,
        response: { items: [ { permissionTypes: [ 'CREATE', 'UPDATE' ] } ] }
      });

      const zeebeApi = createZeebeApi({
        getCurrentUser: sinon.stub().resolves({ success: true, response: { authorizedComponents: [] } }),
        getAuthorizations
      });
      const cache = new CredentialCache(zeebeApi);

      // when
      const denied = await cache.getPermissions(ENDPOINT);
      const retried = await cache.getPermissions(ENDPOINT);

      // then — the transient deny is not cached, so a later call re-queries
      expect(denied).to.eql({ create: false, update: false });
      expect(retried).to.eql({ create: true, update: true });
      expect(getAuthorizations).to.have.been.calledTwice;
    });


    it('should not cache when the user lookup and authorization search both fail', async function() {

      // given
      const getCurrentUser = sinon.stub();
      getCurrentUser.onFirstCall().resolves({ success: false, status: 500 });
      getCurrentUser.onSecondCall().resolves({ success: true, response: { authorizedComponents: [ '*' ] } });

      const getAuthorizations = sinon.stub().resolves({ success: false, status: 500 });

      const zeebeApi = createZeebeApi({ getCurrentUser, getAuthorizations });
      const cache = new CredentialCache(zeebeApi);

      // when
      const denied = await cache.getPermissions(ENDPOINT);
      const retried = await cache.getPermissions(ENDPOINT);

      // then
      expect(denied).to.eql({ create: false, update: false });
      expect(retried).to.eql({ create: true, update: true });
      expect(getCurrentUser).to.have.been.calledTwice;
    });

  });


  describe('#invalidate', function() {

    it('should re-fetch after invalidation', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      await cache.getCredentials(ENDPOINT);

      // when
      cache.invalidate(ENDPOINT.id);
      await cache.getCredentials(ENDPOINT);

      // then
      expect(zeebeApi.searchClusterVariables).to.have.been.calledTwice;
    });


    it('should keep other connections cached', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      await cache.getCredentials(ENDPOINT);
      await cache.getCredentials(OTHER_ENDPOINT);

      // when
      cache.invalidate(ENDPOINT.id);
      await cache.getCredentials(OTHER_ENDPOINT);

      // then — one for ENDPOINT, one for OTHER_ENDPOINT (still cached)
      expect(zeebeApi.searchClusterVariables).to.have.been.calledTwice;
    });


    it('should re-fetch all connections after invalidateAll', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      await cache.getCredentials(ENDPOINT);
      await cache.getCredentials(OTHER_ENDPOINT);

      // when
      cache.invalidateAll();
      await cache.getCredentials(ENDPOINT);
      await cache.getCredentials(OTHER_ENDPOINT);

      // then
      expect(zeebeApi.searchClusterVariables).to.have.callCount(4);
    });


    it('should keep the fingerprint so later changes are still detected', async function() {

      // given a loaded, fingerprinted connection
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // when force-refreshed (app focus) and reloaded
      cache.invalidate(ENDPOINT.id);
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then a revalidate with the same fingerprint is still a no-op
      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      expect(zeebeApi.searchClusterVariables).to.have.been.calledTwice;
    });

  });


  describe('#revalidate', function() {

    it('should keep the cache while the fingerprint is unchanged', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // when the same fingerprint is seen again (re-check, tab activation)
      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then no refetch
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
    });


    it('should re-fetch credentials when the fingerprint changes', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // when the fingerprint changes (cluster, tenant or principal changed)
      cache.revalidate(ENDPOINT.id, 'fp-2');
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then
      expect(zeebeApi.searchClusterVariables).to.have.been.calledTwice;
    });


    it('should drop permissions when the fingerprint changes', async function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getPermissions(ENDPOINT);

      // when
      cache.revalidate(ENDPOINT.id, 'fp-2');
      await cache.getPermissions(ENDPOINT);

      // then
      expect(zeebeApi.getCurrentUser).to.have.been.calledTwice;
    });


    it('should not fetch when revalidating before the first load', function() {

      // given
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      // when revalidate only initializes the fingerprint (no data yet)
      cache.revalidate(ENDPOINT.id, 'fp-1');

      // then nothing is fetched
      expect(zeebeApi.searchClusterVariables).not.to.have.been.called;
      expect(zeebeApi.getCurrentUser).not.to.have.been.called;
    });


    it('should be idempotent across tabs on the same connection', async function() {

      // given two tabs on the same connection see the same fingerprint
      const zeebeApi = createZeebeApi();
      const cache = new CredentialCache(zeebeApi);

      // when
      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getCredentials(ENDPOINT, TEMPLATE);
      cache.revalidate(ENDPOINT.id, 'fp-1');
      await cache.getCredentials(ENDPOINT, TEMPLATE);

      // then a single shared fetch
      expect(zeebeApi.searchClusterVariables).to.have.been.calledOnce;
    });

  });

});


// helpers //////////

function createZeebeApi(overrides = {}) {
  return {
    getAuthorizations: sinon.stub().resolves({ success: true, response: { items: [] } }),
    getCurrentUser: sinon.stub().resolves({ success: true, response: { authorizedComponents: [] } }),
    searchClusterVariables: sinon.stub().resolves({ success: true, response: { items: [] } }),
    ...overrides
  };
}
