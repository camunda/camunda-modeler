/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const log = require('../log')('app:c8ctl');

const DEFAULT_TIMEOUT = 10000;

const CLUSTER_START_TIMEOUT = 5 * 60 * 1000;
const CLUSTER_STOP_TIMEOUT = 2 * 60 * 1000;

const PROFILES_CACHE_TTL = 10000;

const MODELER_PREFIX = 'modeler:';

const ERROR_REASONS = {
  NOT_INSTALLED: 'NOT_INSTALLED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  UNKNOWN: 'UNKNOWN',
  CONTACT_POINT_UNAVAILABLE: 'CONTACT_POINT_UNAVAILABLE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN'
};

/**
 * Runs c8ctl as a child process on Electron's own Node runtime.
 */
class C8ctl {

  /**
   * @param {Object} options
   * @param {string} [options.binPath] - path to c8ctl `dist/index.js`
   * @param {string} options.modelerDataDir - this Modeler's userData, so c8ctl sees its connections
   * @param {() => Array<{ id: string }>} options.getModelerConnections - connections saved in this Modeler
   */
  constructor({ binPath, modelerDataDir, getModelerConnections }) {
    this._binPath = binPath;
    this._modelerDataDir = modelerDataDir;
    this._getModelerConnections = getModelerConnections;

    this._profilesCache = null;
    this._clusterOperation = null;
  }

  isInstalled() {
    return !!this._binPath && fs.existsSync(this._binPath);
  }

  /**
   * @param {string[]} args
   * @param {{ timeout?: number, input?: string }} [options]
   *
   * @returns {Promise<{ ok: boolean, data?: any, error?: Object, messages: Object[], durationMs: number }>}
   */
  run(args, { timeout = DEFAULT_TIMEOUT, input } = {}) {
    if (!this.isInstalled()) {
      return Promise.resolve({
        ok: false,
        error: { reason: ERROR_REASONS.NOT_INSTALLED, message: 'c8ctl not found' },
        messages: [],
        durationMs: 0
      });
    }

    const start = Date.now();

    return new Promise(resolve => {
      const child = execFile(process.execPath, [ this._binPath, ...args, '--json' ], {
        env: this._getEnv(),
        timeout,
        maxBuffer: 10 * 1024 * 1024
      }, (err, stdout, stderr) => {
        const durationMs = Date.now() - start;

        const messages = parseLines(stderr);
        const errorMessage = messages.find(m => m.status === 'error');

        let data;

        try {
          data = stdout.trim() ? JSON.parse(stdout) : undefined;
        } catch (parseError) {
          data = undefined;
        }

        const ok = !err && !errorMessage;

        log.info(`c8ctl ${ args.join(' ') } -> ${ ok ? 'ok' : 'error' } in ${ durationMs }ms`);

        resolve({
          ok,
          data,
          error: ok ? undefined : toError(err, errorMessage, messages),
          messages,
          durationMs
        });
      });

      child.stdin.end(input);
    });
  }

  async listProfiles() {
    const result = await this.run([ 'list', 'profiles' ]);

    if (!result.ok) {
      return result;
    }

    const profiles = (result.data || []).filter(profile => profile.Source === 'c8ctl');

    this._profilesCache = { profiles, time: Date.now() };

    return {
      ...result,
      data: profiles
    };
  }

  /**
   * c8ctl silently falls back to another profile if the given one does not exist,
   * so every call has to verify the profile first.
   *
   * @param {string} profile
   * @param {{ fresh?: boolean }} [options]
   *
   * @returns {Promise<{ reason: string, message: string }|null>} error or `null`
   */
  async verifyProfile(profile, { fresh = false } = {}) {
    if (profile.startsWith(MODELER_PREFIX)) {
      const id = profile.slice(MODELER_PREFIX.length);

      if ((this._getModelerConnections() || []).some(connection => connection.id === id)) {
        return null;
      }
    } else {
      const cache = this._profilesCache;

      const profiles = !fresh && cache && Date.now() - cache.time < PROFILES_CACHE_TTL
        ? cache.profiles
        : (await this.listProfiles()).data || [];

      if (profiles.some(({ Name }) => Name === profile)) {
        return null;
      }
    }

    return {
      reason: ERROR_REASONS.PROFILE_NOT_FOUND,
      message: `c8ctl profile <${ profile }> not found`
    };
  }

  /**
   * Same result shape as `ZeebeAPI#checkConnection`.
   *
   * @param {string} profile
   */
  async checkConnection(profile) {
    const profileError = await this.verifyProfile(profile);

    if (profileError) {
      return {
        success: false,
        reason: ERROR_REASONS.UNKNOWN,
        c8ctl: profileError
      };
    }

    const result = await this.run([ 'get', 'topology', '--profile', profile ]);

    if (!result.ok) {
      return {
        success: false,
        reason: result.error.reason,
        c8ctl: { message: result.error.message, hint: result.error.hint, durationMs: result.durationMs }
      };
    }

    return {
      success: true,
      response: {
        protocol: 'rest',
        gatewayVersion: result.data.gatewayVersion
      },
      c8ctl: { durationMs: result.durationMs }
    };
  }

  /**
   * Same result shape as `ZeebeAPI#deploy`. Files must be saved before.
   *
   * @param {{ profile: string, resourceConfigs: Array<{ path: string }> }} options
   */
  async deploy({ profile, resourceConfigs }) {
    const profileError = await this.verifyProfile(profile, { fresh: true });

    if (profileError) {
      return {
        success: false,
        response: { message: profileError.message }
      };
    }

    const paths = resourceConfigs.map(({ path }) => path);

    const result = await this.run([ 'deploy', ...paths, '--profile', profile ], { timeout: 60000 });

    if (!result.ok) {
      return {
        success: false,
        response: {
          message: result.error.message,
          details: result.error.message
        }
      };
    }

    const success = result.messages.find(m => m.status === 'success');

    return {
      success: true,
      response: {
        key: success && success.key,
        deployments: toDeployments(result.data || [])
      }
    };
  }

  /**
   * Same result shape as `ZeebeAPI#startInstance`.
   *
   * @param {{ profile: string, processId: string, variables?: Object, businessId?: string, startInstructions?: Array, runtimeInstructions?: Array }} options
   */
  async startInstance({ profile, processId, variables, businessId, startInstructions, runtimeInstructions }) {
    if (startInstructions?.length || runtimeInstructions?.length) {
      return {
        success: false,
        response: { message: 'Start and runtime instructions are not supported by c8ctl' }
      };
    }

    const profileError = await this.verifyProfile(profile, { fresh: true });

    if (profileError) {
      return {
        success: false,
        response: { message: profileError.message }
      };
    }

    const args = [ 'create', 'pi', '--id', processId, '--variables', '@-', '--profile', profile ];

    if (businessId) {
      args.push('--businessId', businessId);
    }

    const result = await this.run(args, { input: JSON.stringify(variables || {}) });

    if (!result.ok) {
      return {
        success: false,
        response: {
          message: result.error.message,
          details: result.error.message
        }
      };
    }

    // the instance key is only reported on stderr
    const success = result.messages.find(m => m.status === 'success');

    return {
      success: true,
      response: {
        processInstanceKey: success && success.key,
        processDefinitionId: processId
      }
    };
  }

  /**
   * @returns {Promise<{ status: 'running'|'stopped'|'starting'|'stopping'|'unknown', version?: string, urls?: Object, error?: Object }>}
   */
  async clusterStatus() {
    if (this._clusterOperation) {
      return { status: this._clusterOperation };
    }

    const result = await this.run([ 'cluster', 'status' ]);

    if (!result.ok || !result.data) {
      return { status: 'unknown', error: result.error };
    }

    return result.data;
  }

  clusterStart() {
    return this._runClusterOperation('starting', [ 'cluster', 'start' ], CLUSTER_START_TIMEOUT);
  }

  clusterStop() {
    return this._runClusterOperation('stopping', [ 'cluster', 'stop' ], CLUSTER_STOP_TIMEOUT);
  }

  async _runClusterOperation(operation, args, timeout) {
    if (this._clusterOperation) {
      return { ok: false, error: { message: `Local cluster is ${ this._clusterOperation }` } };
    }

    this._clusterOperation = operation;

    try {
      const result = await this.run(args, { timeout });

      return { ok: result.ok, error: result.error, durationMs: result.durationMs };
    } finally {
      this._clusterOperation = null;
    }
  }

  _getEnv() {
    const env = {};

    // CAMUNDA_* variables would override the profile passed explicitly
    for (const [ key, value ] of Object.entries(process.env)) {
      if (!key.startsWith('CAMUNDA_')) {
        env[key] = value;
      }
    }

    return {
      ...env,
      ELECTRON_RUN_AS_NODE: '1',
      C8CTL_MODELER_DIR: this._modelerDataDir,

      // only switch to turn off c8ctl's background npm registry update check
      CI: '1'
    };
  }
}

/**
 * @returns {string|null} path to the CLI entry of the bundled `@camunda8/cli`
 */
function getBundledBinPath() {
  try {

    // the package exports `./runtime` (dist/core/runtime.js) only
    return path.join(path.dirname(require.resolve('@camunda8/cli/runtime')), '..', 'index.js');
  } catch (error) {
    return null;
  }
}

module.exports = C8ctl;
module.exports.ERROR_REASONS = ERROR_REASONS;
module.exports.getBundledBinPath = getBundledBinPath;


// helpers //////////

/**
 * Map c8ctl deploy rows (`{ File, Type, ID, Version, Key }`) to the
 * deployments shape the Modeler uses for gRPC and REST.
 */
function toDeployments(rows) {

  // c8ctl does not return the requirements key of a decision; one DMN file has one DRD
  const drdKeyByFile = {};

  rows
    .filter(row => row.Type === 'Decision Requirements')
    .forEach(row => drdKeyByFile[ row.File ] = row.Key);

  return rows.map(row => {
    const { File: resourceName, ID: id, Version: version, Key: key } = row;

    switch (row.Type) {
    case 'Process':
      return { process: { bpmnProcessId: id, version, processDefinitionKey: key, resourceName } };
    case 'Decision':
      return {
        decision: {
          dmnDecisionId: id,
          decisionId: id,
          version,
          decisionKey: key,
          decisionRequirementsKey: drdKeyByFile[ resourceName ],
          resourceName
        }
      };
    case 'Decision Requirements':
      return { decisionRequirements: { dmnDecisionRequirementsId: id, version, decisionRequirementsKey: key, resourceName } };
    case 'Form':
      return { form: { formId: id, version, formKey: key, resourceName } };
    default:
      return { resource: { resourceId: id, version, resourceKey: key, resourceName } };
    }
  });
}

function parseLines(output) {
  return output
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { status: 'text', message: line };
      }
    });
}

function toError(err, errorMessage, messages) {
  if (!errorMessage) {
    return {
      reason: ERROR_REASONS.UNKNOWN,
      message: err ? err.message : 'c8ctl failed without an error message'
    };
  }

  const details = messages
    .filter(m => m.type === 'message' && m.message)
    .map(m => m.message.trim());

  return {
    reason: getErrorReason(errorMessage),
    message: [ errorMessage.message, errorMessage.error, ...details ].filter(Boolean).join(': '),
    hint: errorMessage.hint
  };
}

// c8ctl has no error codes yet, so the reason is guessed from its English text
function getErrorReason({ error = '', message = '' }) {
  const text = `${ message } ${ error }`;

  if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i.test(text)) {
    return ERROR_REASONS.CONTACT_POINT_UNAVAILABLE;
  }

  if (/invalid_client|401|unauthorized/i.test(text)) {
    return ERROR_REASONS.UNAUTHORIZED;
  }

  if (/403|forbidden/i.test(text)) {
    return ERROR_REASONS.FORBIDDEN;
  }

  return ERROR_REASONS.UNKNOWN;
}
