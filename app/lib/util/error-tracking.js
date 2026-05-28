/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const os = require('os');

const log = require('../log')('app:error-tracking');

const { RewriteFrames } = require('@sentry/integrations');

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const EDITOR_ID_CONFIG_KEY = 'editor.id';
const CRASH_REPORTS_CONFIG_KEY = 'ENABLE_CRASH_REPORTS';
const NON_EXISTENT_EDITOR_ID = 'NON_EXISTENT_EDITOR_ID';

const SENTRY_DSN_FLAG = 'sentry-dsn';
const DISABLE_REMOTE_INTERACTION_FLAG = 'disable-remote-interaction';

let isActive = false;

const additionalTags = [];

module.exports.start = function(Sentry, version, config, flags, renderer) {

  // set initial module state
  isActive = false;

  const editorID = config.get(EDITOR_ID_CONFIG_KEY) || NON_EXISTENT_EDITOR_ID;

  const { result, reason } = canInitializeSentry(config, flags);

  if (!result) {
    log.info('Cannot initialize Sentry: ', reason);
  } else {
    initializeSentry(Sentry, editorID, version, getDSN(flags));
  }

  // listen to frontend in case the user turned on/off error tracking option
  // via privacy preferences
  listenToFrontend(Sentry, editorID, version, flags, renderer);
};

/**
 * Set additional tag in Sentry
 *
 * @param {import('@sentry/node')} Sentry
 * @param {string} key
 * @param {any} value
 */
module.exports.setTag = function(Sentry, key, value) {
  additionalTags.push({ key, value });

  if (isActive) {
    Sentry.setTag(key, value);
  }
};

function listenToFrontend(Sentry, editorID, version, flags, renderer) {
  renderer.on('errorTracking:turnedOn', function() {

    initializeSentry(Sentry, editorID, version, getDSN(flags));
  });

  renderer.on('errorTracking:turnedOff', function() {

    closeSentry(Sentry);
  });
}

function getDSN(flags) {
  return flags.get(SENTRY_DSN_FLAG) || process.env.SENTRY_DSN;
}

function canInitializeSentry(config, flags) {
  const privacyPreferences = config.get(PRIVACY_PREFERENCES_CONFIG_KEY);
  const crashReportsEnabled = privacyPreferences && privacyPreferences[CRASH_REPORTS_CONFIG_KEY];

  if (!crashReportsEnabled) {
    return {
      result: false,
      reason: 'Crash reports not enabled.'
    };
  }

  const sentryDSN = getDSN(flags);

  if (!sentryDSN) {
    return {
      result: false,
      reason: 'DSN not set.'
    };
  }

  const isRemoteInteractionDisabled = flags.get(DISABLE_REMOTE_INTERACTION_FLAG);

  if (isRemoteInteractionDisabled) {
    return {
      result: false,
      reason: 'Remote interaction disabled via flag.'
    };
  }

  return { result: true };
}

function initializeSentry(Sentry, editorID, release, dsn) {

  try {

    Sentry.init({
      dsn,
      release,
      integrations: [
        new RewriteFrames({
          iteratee: (frame) => {
            if (!frame.filename) {
              return frame;
            }

            frame.filename = normalizeUrl(frame.filename);
            return frame;
          }
        })
      ]
    });

    Sentry.setTag('editor-id', editorID);
    Sentry.setTag('is-backend-error', true);
    Sentry.setTag('platform', os.platform());
    Sentry.setTag('os-version', os.release());

    additionalTags.forEach(({ key, value }) => {
      Sentry.setTag(key, value);
    });

    Sentry.setUser({ id: editorID });

    log.info('Sentry initialized.');
    isActive = true;
  } catch (err) {

    log.error('Error initializing Sentry', err);
  }
}

function closeSentry(Sentry) {

  try {

    Sentry.close();

    log.info('Sentry closed.');
    isActive = false;
  } catch (err) {

    log.error('Error happened closing Sentry', err);
  }
}

function normalizeUrl(path) {

  // eslint-disable-next-line
  const filename = path.replace(/^.*[\\\/]/, '');
  return 'file:///build/' + filename;
}
