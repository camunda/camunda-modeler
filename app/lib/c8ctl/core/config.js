/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Connection profile resolution.
 *
 * Ported from c8ctl `src/core/config.ts`. Resolves Camunda 8 connection
 * settings from two on-disk sources:
 *
 *   1. The c8ctl profile store (`profiles.json`) — c8ctl's native format.
 *   2. The Camunda Modeler settings (`settings.json` →
 *      `connectionManagerPlugin.c8connections`) — read-only, surfaced with a
 *      `modeler:` prefix.
 *
 * Reading these files is the single permitted filesystem side-effect of the
 * embedded c8ctl module (the "profile read" exception). Profiles are never
 * written from within the Modeler.
 */

const fs = require('node:fs');
const { homedir, platform } = require('node:os');
const { join } = require('node:path');

const TARGET_TYPES = {
  CAMUNDA_CLOUD: 'camundaCloud',
  SELF_HOSTED: 'selfHosted'
};

const AUTH_TYPES = {
  NONE: 'none',
  BASIC: 'basic',
  OAUTH: 'oauth'
};

const MODELER_PREFIX = 'modeler:';

const DEFAULT_CLOUD_OAUTH_URL = 'https://login.cloud.camunda.io/oauth/token';
const DEFAULT_SELF_HOSTED_URL = 'http://localhost:8080/v2';

/**
 * Resolves and reads connection profiles from disk.
 *
 * The filesystem layer is injectable to keep the class unit-testable without
 * touching the real home directory.
 */
class Config {

  /**
   * @param { {
   *   fs?: { existsSync: Function, readFileSync: Function },
   *   userDataDir?: string,
   *   modelerDataDir?: string
   * } } [options]
   */
  constructor(options = {}) {
    this._fs = options.fs || fs;
    this._userDataDir = options.userDataDir || getUserDataDir();
    this._modelerDataDir = options.modelerDataDir || getModelerDataDir();
  }

  _readJSON(filePath) {
    if (!this._fs.existsSync(filePath)) {
      return undefined;
    }

    try {
      return JSON.parse(this._fs.readFileSync(filePath, 'utf-8'));
    } catch {
      return undefined;
    }
  }

  /**
   * Load c8ctl native profiles from `profiles.json`.
   *
   * @returns {Array<object>}
   */
  loadProfiles() {
    const data = this._readJSON(join(this._userDataDir, 'profiles.json'));

    return (data && Array.isArray(data.profiles)) ? data.profiles : [];
  }

  /**
   * Load Modeler connections from `settings.json` (read-only).
   *
   * @returns {Array<object>}
   */
  loadModelerConnections() {
    const settings = this._readJSON(join(this._modelerDataDir, 'settings.json'));

    if (!settings) {
      return [];
    }

    const connections = settings['connectionManagerPlugin.c8connections'];

    if (!Array.isArray(connections)) {
      return [];
    }

    return connections.filter((connection) => connection && connection.id);
  }

  /**
   * All profiles, merging c8ctl profiles with Modeler connections (the latter
   * prefixed with `modeler:`).
   *
   * @returns {Array<object>}
   */
  getAllProfiles() {
    const c8ctlProfiles = this.loadProfiles();

    const modelerProfiles = this.loadModelerConnections()
      .map(connectionToProfile)
      .map((profile) => ({
        ...profile,
        name: `${MODELER_PREFIX}${profile.name}`,
        source: 'modeler'
      }));

    const nativeProfiles = c8ctlProfiles.map((profile) => ({
      ...profile,
      source: 'c8ctl'
    }));

    return [ ...nativeProfiles, ...modelerProfiles ];
  }

  /**
   * Resolve a profile by name across both sources. Accepts Modeler names with
   * or without the `modeler:` prefix.
   *
   * @param {string} name
   * @returns {object|undefined}
   */
  getProfileOrModeler(name) {
    const profiles = this.getAllProfiles();

    const direct = profiles.find((profile) => profile.name === name);

    if (direct) {
      return direct;
    }

    const prefixed = `${MODELER_PREFIX}${name}`;

    return profiles.find((profile) => profile.name === prefixed);
  }

  /**
   * The Modeler connection the terminal should fall back to when no profile has
   * been selected in the session. Mirrors the Modeler's own notion of a
   * "default" connection: the local c8run connection if present, otherwise the
   * sole Modeler connection.
   *
   * @returns {object|undefined} the raw Modeler connection
   */
  getDefaultModelerConnection() {
    const connections = this.loadModelerConnections();

    if (connections.length === 0) {
      return undefined;
    }

    const c8run = connections.find(isC8RunConnection);

    if (c8run) {
      return c8run;
    }

    if (connections.length === 1) {
      return connections[0];
    }

    return undefined;
  }

  /**
   * The profile name implicitly used when nothing is selected in the session.
   *
   * Resolution order:
   *   1. the Modeler's current/default connection (`modeler:` prefixed)
   *   2. the sole configured profile, if exactly one exists across both sources
   *
   * @returns {string|undefined}
   */
  getDefaultProfileName() {
    const connection = this.getDefaultModelerConnection();

    if (connection) {
      return `${MODELER_PREFIX}${connection.name || connection.id}`;
    }

    const profiles = this.getAllProfiles();

    if (profiles.length === 1) {
      return profiles[0].name;
    }

    return undefined;
  }

  /**
   * Resolve the effective cluster config used to build an SDK client.
   *
   * Resolution order (mirrors c8ctl):
   *   1. explicit profile name
   *   2. session active profile
   *   3. `CAMUNDA_*` environment variables
   *   4. the sole configured profile, if exactly one exists
   *
   * @param { { profileName?: string, activeProfile?: string } } [opts]
   * @returns {object} cluster config consumed by the client factory
   */
  resolveClusterConfig(opts = {}) {
    const { profileName, activeProfile } = opts;

    const selected = profileName || activeProfile;

    if (selected) {
      const profile = this.getProfileOrModeler(selected);

      if (!profile) {
        throw new Error(`Unknown profile: ${selected}`);
      }

      return profileToClusterConfig(profile);
    }

    const envConfig = clusterConfigFromEnv();

    if (envConfig) {
      return envConfig;
    }

    // fall back to the Modeler's current/default connection (or a sole profile)
    const defaultName = this.getDefaultProfileName();

    if (defaultName) {
      const defaultProfile = this.getProfileOrModeler(defaultName);

      if (defaultProfile) {
        return profileToClusterConfig(defaultProfile);
      }
    }

    const profiles = this.getAllProfiles();

    if (profiles.length === 0) {
      throw new Error(
        'No connection profiles found. Configure a connection in Camunda ' +
        'Modeler or create a c8ctl profile, then select it with `use profile <name>`.'
      );
    }

    throw new Error(
      'No active profile. Select one with `use profile <name>` ' +
      '(see `list profile`).'
    );
  }

  /**
   * Resolve the tenant id for the active profile.
   *
   * @param { { profileName?: string, activeProfile?: string, activeTenant?: string } } [opts]
   * @returns {string|undefined}
   */
  resolveTenantId(opts = {}) {
    const { profileName, activeProfile, activeTenant } = opts;

    if (activeTenant) {
      return activeTenant;
    }

    const selected = profileName || activeProfile;

    if (selected) {
      const profile = this.getProfileOrModeler(selected);

      if (profile && profile.defaultTenantId) {
        return profile.defaultTenantId;
      }

      return process.env.CAMUNDA_TENANT_ID || undefined;
    }

    // no explicit selection: honour the default profile's tenant
    const defaultName = this.getDefaultProfileName();

    if (defaultName) {
      const defaultProfile = this.getProfileOrModeler(defaultName);

      if (defaultProfile && defaultProfile.defaultTenantId) {
        return defaultProfile.defaultTenantId;
      }
    }

    return process.env.CAMUNDA_TENANT_ID || undefined;
  }
}

/**
 * Platform-specific c8ctl user data directory.
 *
 * @returns {string}
 */
function getUserDataDir() {
  if (process.env.C8CTL_DATA_DIR) {
    return process.env.C8CTL_DATA_DIR;
  }

  const home = homedir();

  switch (platform()) {
  case 'win32':
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'c8ctl');
  case 'darwin':
    return join(home, 'Library', 'Application Support', 'c8ctl');
  default:
    return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'c8ctl');
  }
}

/**
 * Platform-specific Camunda Modeler data directory.
 *
 * @returns {string}
 */
function getModelerDataDir() {
  if (process.env.C8CTL_MODELER_DIR) {
    return process.env.C8CTL_MODELER_DIR;
  }

  const home = homedir();

  switch (platform()) {
  case 'win32':
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'camunda-modeler');
  case 'darwin':
    return join(home, 'Library', 'Application Support', 'camunda-modeler');
  default:
    return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'camunda-modeler');
  }
}

/**
 * Whether a Modeler connection is the local c8run connection. Mirrors the
 * Modeler's own detection (`client/src/plugins/zeebe-plugin/shared/util.js`):
 * a self-hosted connection on `http://localhost:8080` named `c8run*`.
 *
 * @param {object} connection
 * @returns {boolean}
 */
function isC8RunConnection(connection) {
  if (!connection) {
    return false;
  }

  const urlMatches = /^http:\/\/localhost:8080/i.test(connection.contactPoint || '');
  const nameMatches = /^c8run/i.test(connection.name || '');

  return urlMatches && nameMatches;
}

/**
 * Convert a Modeler connection to a cluster config.
 *
 * @param {object} connection
 * @returns {object}
 */
function connectionToClusterConfig(connection) {
  if (connection.targetType === TARGET_TYPES.CAMUNDA_CLOUD) {
    const audience = connection.audience && connection.audience.trim();
    const oAuthUrl = connection.oauthURL && connection.oauthURL.trim();

    return {
      baseUrl: connection.camundaCloudClusterUrl || '',
      clientId: connection.camundaCloudClientId,
      clientSecret: connection.camundaCloudClientSecret,
      audience: audience || undefined,
      oAuthUrl: oAuthUrl || DEFAULT_CLOUD_OAUTH_URL
    };
  }

  const config = {
    baseUrl: connection.contactPoint || DEFAULT_SELF_HOSTED_URL
  };

  if (connection.authType === AUTH_TYPES.BASIC) {
    config.username = connection.basicAuthUsername;
    config.password = connection.basicAuthPassword;
  } else if (connection.authType === AUTH_TYPES.OAUTH) {
    config.clientId = connection.clientId;
    config.clientSecret = connection.clientSecret;
    config.oAuthUrl = connection.oauthURL;
    config.audience = connection.audience;
  }

  return config;
}

/**
 * Convert a Modeler connection to c8ctl profile shape.
 *
 * @param {object} connection
 * @returns {object}
 */
function connectionToProfile(connection) {
  const config = connectionToClusterConfig(connection);

  return {
    name: connection.name || connection.id,
    baseUrl: config.baseUrl,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    audience: config.audience,
    oAuthUrl: config.oAuthUrl,
    username: config.username,
    password: config.password,
    defaultTenantId: connection.tenantId
  };
}

/**
 * Convert a c8ctl profile to a cluster config.
 *
 * @param {object} profile
 * @returns {object}
 */
function profileToClusterConfig(profile) {
  return {
    baseUrl: profile.baseUrl,
    clientId: profile.clientId,
    clientSecret: profile.clientSecret,
    audience: profile.audience,
    oAuthUrl: profile.oAuthUrl,
    username: profile.username,
    password: profile.password
  };
}

/**
 * Build a cluster config from `CAMUNDA_*` environment variables, or undefined
 * when `CAMUNDA_BASE_URL` is not set.
 *
 * @returns {object|undefined}
 */
function clusterConfigFromEnv() {
  const baseUrl = process.env.CAMUNDA_BASE_URL;

  if (!baseUrl) {
    return undefined;
  }

  return {
    baseUrl,
    clientId: process.env.CAMUNDA_CLIENT_ID,
    clientSecret: process.env.CAMUNDA_CLIENT_SECRET,
    audience: process.env.CAMUNDA_TOKEN_AUDIENCE,
    oAuthUrl: process.env.CAMUNDA_OAUTH_URL,
    username: process.env.CAMUNDA_USERNAME,
    password: process.env.CAMUNDA_PASSWORD
  };
}

module.exports = {
  Config,
  TARGET_TYPES,
  AUTH_TYPES,
  MODELER_PREFIX,
  getUserDataDir,
  getModelerDataDir,
  connectionToClusterConfig,
  connectionToProfile,
  profileToClusterConfig
};
