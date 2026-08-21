/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import debug from 'debug';

const log = debug('CredentialCache');

const SEARCH_PAGE_SIZE = 100;

const CREDENTIAL_KIND = 'CREDENTIAL';

/**
 * Connection-scoped, session-lived cache for a cluster's credentials: the
 * user's create/update permissions (per CONNECTION) and the credential cluster
 * variables (`metadata.kind = CREDENTIAL`), searched server-side per
 * configuration template and cached per (CONNECTION, configurationTemplate).
 *
 * Permissions are independent of any template, so they are keyed by connection
 * alone. Credentials are keyed additionally by `configurationTemplate` and the
 * search is server-filtered by it, so each fetch returns only that template's
 * credentials rather than the cluster's entire credential population.
 *
 * All queries are memoized and coalesce concurrent in-flight requests, so two
 * tabs on the same connection+template share a single network fetch.
 *
 * Staleness is driven by the connection's identity, not by wall-clock time:
 * `revalidate(connectionId, connectionFingerprint)` compares an opaque
 * fingerprint (emitted by the connection lifecycle) against the one the cached
 * data was loaded under and drops the connection's data only when it changed —
 * a different cluster, tenant or principal, or a reconnect. An unchanged
 * fingerprint (the common case: tab activation or a periodic re-check of the
 * same connection) is a no-op, so activating a tab does NOT trigger a refetch.
 * Because the decision is a pure function of the fingerprint, it is idempotent
 * across tabs. `invalidate(connectionId)` unconditionally drops a connection's
 * cached data (keeping its identity fingerprint) and is used for the explicit
 * app-focus force-refresh (to pick up credentials created outside the app);
 * `invalidateAll` evicts everything, fingerprints included.
 *
 * In-app modifications write through to the cache via `upsertCredential`, so a
 * credential created/edited in one tab is reflected in every other tab on the
 * same connection when they re-activate (inactive tabs are unmounted and re-read
 * the cache on mount). Credentials created OUTSIDE the app (Hub, another client)
 * cannot be pushed and are picked up on the next focus/reconnect invalidation —
 * matching the session-cached design.
 *
 * Every load, cache hit and invalidation is logged under the `CredentialCache`
 * debug namespace (`localStorage.debug = 'CredentialCache'`), so it is visible
 * when an actual network fetch happens versus a cache hit.
 */
export default class CredentialCache {

  /**
   * @param {Object} zeebeApi
   */
  constructor(zeebeApi) {
    this._zeebeApi = zeebeApi;

    /**
     * @type {Map<string, { fingerprint: string|undefined, permissions: Promise|null, credentials: Map<string, Promise> }>}
     */
    this._connections = new Map();
  }

  /**
   * Resolve the user's create/update permissions for credentials on the
   * connected cluster, cached for the session. Only a result derived from a
   * SUCCESSFUL query is cached; a deny derived from a failed user lookup or
   * authorization search is returned for the current render but not cached, so
   * a later trigger re-queries instead of sticking on a transient deny.
   *
   * @param {Object} endpoint
   *
   * @returns {Promise<{ create: boolean, update: boolean }>}
   */
  getPermissions(endpoint) {
    const entry = this._getEntry(endpoint.id);

    if (entry.permissions) {
      log('permissions: cache hit', endpoint.id);

      return entry.permissions;
    }

    log('permissions: load', endpoint.id);

    const promise = this._loadPermissions(endpoint).then(({ permissions, cacheable }) => {
      if (cacheable) {
        log('permissions: loaded', endpoint.id, permissions);
      } else {
        log('permissions: loaded (not cacheable, clearing)', endpoint.id, permissions);

        this._clearPermissions(endpoint.id, promise);
      }

      return permissions;
    });

    entry.permissions = promise;

    promise.catch(error => {
      log('permissions: load failed', endpoint.id, error);

      this._clearPermissions(endpoint.id, promise);
    });

    return entry.permissions;
  }

  /**
   * Resolve the credential cluster variables for a single configuration
   * template on the connected cluster, server-filtered by that template and
   * cached for the session. Only successful results are cached; a failure clears
   * the entry so a later trigger can retry.
   *
   * @param {Object} endpoint
   * @param {string} configurationTemplate
   *
   * @returns {Promise<Object>} the (paged) cluster-variable search result
   */
  getCredentials(endpoint, configurationTemplate) {
    const entry = this._getEntry(endpoint.id);

    const cached = entry.credentials.get(configurationTemplate);

    if (cached) {
      log('credentials: cache hit', endpoint.id, configurationTemplate);

      return cached;
    }

    log('credentials: load', endpoint.id, configurationTemplate);

    const promise = this._loadCredentials(endpoint, configurationTemplate);

    entry.credentials.set(configurationTemplate, promise);

    promise.then(
      result => {
        if (!result || !result.success) {
          log('credentials: load failed', endpoint.id, configurationTemplate, result && result.status);

          this._clearCredentials(endpoint.id, configurationTemplate, promise);
        } else {
          log('credentials: loaded', endpoint.id, configurationTemplate, (result.response.items || []).length);
        }
      },
      error => {
        log('credentials: load failed', endpoint.id, configurationTemplate, error);

        this._clearCredentials(endpoint.id, configurationTemplate, promise);
      }
    );

    return promise;
  }

  /**
   * Write a created or updated credential into the connection's cached source,
   * so other tabs on the same connection reflect it on their next (re)load
   * without a network refetch.
   *
   * In-app modifications from any tab MUST call this: inactive tabs are
   * unmounted (only the active tab is mounted), so they cannot be notified via
   * events — the shared cache is the single source of truth they re-read when
   * re-activated. The credential is written into the bucket for its own
   * `metadata.configurationTemplate`; upsert is by name.
   *
   * No-op when that template's source is not cached yet (nothing to keep in
   * sync; the next load fetches fresh and includes the new credential).
   *
   * @param {string} connectionId
   * @param {{ name: string, metadata: Object }} credential
   */
  upsertCredential(connectionId, credential) {
    const entry = this._connections.get(connectionId);

    if (!entry) {
      return;
    }

    const configurationTemplate = credential.metadata && credential.metadata.configurationTemplate;

    const existing = entry.credentials.get(configurationTemplate);

    if (!existing) {
      return;
    }

    log('upserting credential', connectionId, configurationTemplate, credential.name);

    const promise = existing.then(result => {
      if (!result || !result.success) {
        return result;
      }

      const items = result.response.items || [];

      return {
        ...result,
        response: {
          ...result.response,
          items: [ ...items.filter(item => item.name !== credential.name), credential ]
        }
      };
    });

    entry.credentials.set(configurationTemplate, promise);

    // preserve the retry-on-failure invariant: if the underlying fetch failed,
    // don't keep the (unpatched) failure cached
    promise.then(
      result => {
        if (!result || !result.success) {
          this._clearCredentials(connectionId, configurationTemplate, promise);
        }
      },
      () => this._clearCredentials(connectionId, configurationTemplate, promise)
    );
  }

  /**
   * Reconcile a connection's cache against its current identity fingerprint,
   * dropping the cached permissions and credentials only when the fingerprint
   * differs from the one the data was loaded under.
   *
   * The fingerprint is an opaque token emitted by the connection lifecycle
   * (`connectionFingerprint`); it changes when the cluster, tenant, principal or
   * connection status behind a (stable) connection id changes, and stays equal
   * across tab activations and periodic re-checks of an unchanged connection.
   * Callers should run this on every connection status change before reading:
   * an unchanged fingerprint is a cheap no-op (no refetch on activation), a
   * changed one resets the connection so the next read re-queries the cluster.
   *
   * Idempotent across tabs: the outcome depends only on the stored vs. given
   * fingerprint, so concurrent tabs on the same connection converge without
   * refetching.
   *
   * @param {string} connectionId
   * @param {string} fingerprint
   */
  revalidate(connectionId, fingerprint) {
    const entry = this._getEntry(connectionId);

    if (entry.fingerprint === fingerprint) {
      log('revalidate: unchanged', connectionId);

      return;
    }

    if (entry.fingerprint === undefined) {
      log('revalidate: init', connectionId);
    } else {
      log('revalidate: changed, clearing', connectionId);

      this._clearData(entry);
    }

    entry.fingerprint = fingerprint;
  }

  /**
   * Drop a connection's cached permissions and credentials, e.g. on app focus, so
   * the next consumer re-queries the cluster. The identity fingerprint is left
   * untouched: only the data axis is cleared, the connection is still the same
   * one (identity is `revalidate`'s concern, full eviction is `invalidateAll`).
   *
   * @param {string} connectionId
   */
  invalidate(connectionId) {
    const entry = this._connections.get(connectionId);

    if (!entry) {
      return;
    }

    log('invalidating', connectionId);

    this._clearData(entry);
  }

  /** Drop every connection's cache, fingerprints included. */
  invalidateAll() {
    log('invalidating all');

    this._connections.clear();
  }

  _getEntry(connectionId) {
    if (!this._connections.has(connectionId)) {
      this._connections.set(connectionId, { fingerprint: undefined, permissions: null, credentials: new Map() });
    }

    return this._connections.get(connectionId);
  }

  /** Clear the data axis (permissions + credentials) of an entry, keeping its identity. */
  _clearData(entry) {
    entry.permissions = null;
    entry.credentials.clear();
  }

  _clearPermissions(connectionId, promise) {
    const entry = this._connections.get(connectionId);

    if (entry && entry.permissions === promise) {
      entry.permissions = null;
    }
  }

  _clearCredentials(connectionId, configurationTemplate, promise) {
    const entry = this._connections.get(connectionId);

    if (entry && entry.credentials.get(configurationTemplate) === promise) {
      entry.credentials.delete(configurationTemplate);
    }
  }

  _loadCredentials(endpoint, configurationTemplate) {
    return getAllSearchResults(page => this._zeebeApi.searchClusterVariables(
      { endpoint },
      credentialsSearchFilter(configurationTemplate),
      page
    ));
  }

  async _loadPermissions(endpoint) {
    const currentUserResult = await this._zeebeApi.getCurrentUser({ endpoint });

    if (hasFullAccess(currentUserResult)) {
      return { permissions: { create: true, update: true }, cacheable: true };
    }

    const authorizationsResult = await getAllSearchResults(page => this._zeebeApi.getAuthorizations(
      { endpoint },
      'CLUSTER_VARIABLE',
      page
    ));

    // The deny/allow is derived solely from the authorization search (a non-full
    // user lookup only tells us the user is not a wildcard admin). A SUCCESSFUL
    // search — even an empty one on an authz-enabled cluster — is authoritative
    // and cacheable. A FAILED search yields a bogus deny that must not stick, so
    // mark it non-cacheable and let a later trigger re-query.
    return {
      permissions: getConfigurationPermissions(authorizationsResult),
      cacheable: authorizationsResult.success
    };
  }
}


// helpers //////////

/**
 * The server-side filter matching the credential cluster variables for a single
 * configuration template.
 *
 * @param {string} configurationTemplate
 *
 * @returns {Object}
 */
function credentialsSearchFilter(configurationTemplate) {
  return {
    metadata: {
      kind: { '$eq': CREDENTIAL_KIND },
      configurationTemplate: { '$eq': configurationTemplate }
    }
  };
}

/**
 * Fetch every page from a search endpoint using cursor pagination.
 *
 * @param {Function} search
 *
 * @returns {Promise<Object>}
 */
async function getAllSearchResults(search) {
  const items = [];
  let after;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = {
      limit: SEARCH_PAGE_SIZE,
      ...(after ? { after } : {})
    };
    const result = await search(page);

    if (!result.success) {
      return result;
    }

    const responseItems = result.response.items || [];
    const endCursor = result.response.page && result.response.page.endCursor;

    items.push(...responseItems);

    hasNextPage = responseItems.length > 0 && !!endCursor && endCursor !== after;
    after = endCursor;

    if (!hasNextPage) {
      return {
        ...result,
        response: {
          ...result.response,
          items
        }
      };
    }
  }
}

/**
 * Whether the current user has full access — either authorizations are disabled
 * on the cluster or the user is a wildcard admin — signalled by a `*` entry in
 * their `authorizedComponents`.
 *
 * @param {Object} currentUserResult
 *
 * @returns {boolean}
 */
function hasFullAccess(currentUserResult) {
  if (!currentUserResult || !currentUserResult.success || !currentUserResult.response) {
    return false;
  }

  const { authorizedComponents } = currentUserResult.response;

  return Array.isArray(authorizedComponents) && authorizedComponents.includes('*');
}

/**
 * Derive create/update permissions from an authorizations search result.
 *
 * @param {Object} authorizationsResult
 *
 * @returns {{ create: boolean, update: boolean }}
 */
function getConfigurationPermissions(authorizationsResult) {
  if (!authorizationsResult || !authorizationsResult.success) {
    return { create: false, update: false };
  }

  const permissions = (authorizationsResult.response.items || [])
    .flatMap(item => item.permissionTypes || []);

  return {
    create: permissions.includes('CREATE'),
    update: permissions.includes('UPDATE')
  };
}
