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

import { PureComponent } from 'react';

import * as Sentry from '@sentry/browser';

import Metadata from '../../util/Metadata';

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const EDITOR_ID_CONFIG_KEY = 'editor.id';
const CRASH_REPORTS_CONFIG_KEY = 'ENABLE_CRASH_REPORTS';
const NON_EXISTENT_EDITOR_ID = 'NON_EXISTENT_EDITOR_ID';

const log = debug('ErrorTracking');

const ONE_MINUTE_MS = 1000 * 60;

// DSN is set to Travis as an env variable, passed to client via WebPack DefinePlugin
const SENTRY_DSN = process.env.SENTRY_DSN;

export default class ErrorTracking extends PureComponent {

  constructor(props) {
    super(props);

    this.SENTRY_DSN = SENTRY_DSN;

    // Setting this here so that we can mock later if necessary.
    this.SCHEDULE_TIME = ONE_MINUTE_MS;

    // Setting this here so that we can mock later if necessary.
    this._sentry = Sentry;

    this._isInitialized = false;
  }

  async componentDidMount() {
    const { result, msg } = await this.canInitializeSentry();

    // -> The user may turn on / off error reporting on the run/
    // -> The user may never actually restart the modeler.
    // That's why we'll schedule a check and turn on / off Sentry if necessary.
    this.scheduleCheck();

    if (!result) {

      return log('Cannot initialize: ' + msg);
    }

    this.initializeSentry();
  }

  async initializeSentry() {

    const { config, _getGlobal } = this.props;

    const editorID = await config.get(EDITOR_ID_CONFIG_KEY) || NON_EXISTENT_EDITOR_ID;

    const releaseTag = Metadata.data.version;

    try {

      // We need to send a message to backend to initialize Sentry in the main process.
      // Note that Sentry in renderer process (browser JS) and main process (node)
      // has to be handled separately -> they have separate source maps and their Sentry
      // modules are different (sentry-browser and sentry-node).
      const backend = _getGlobal('backend');
      backend.send('sentry:initialize', { dsn: this.SENTRY_DSN, releaseTag, editorID });

      // Source map uploaded to Sentry from WebPack is tagged with the
      // version number in package.json which is supposed to be the same
      // with Metadata.data.version (except for dev environments
      // - we don't initialize dev in Sentry.)
      this._sentry.init({
        dsn: this.SENTRY_DSN,
        release: releaseTag
      });

      // OS information already exists by default in Sentry.
      // We'll set editor ID and Camunda Modeler version.
      this._sentry.configureScope(scope => { scope.setTag('editor-id', editorID); });

      const { subscribe } = this.props;

      // Send handled errors to Sentry.
      subscribe('app.error-handled', (error) => {
        if (!this._isInitialized) {
          return;
        }

        this._sentry.captureException(error);
      });

      log('Initialized');

      this._isInitialized = true;

    } catch (err) {

      log('Cannot initialize: ', err);
    }
  }

  closeSentry() {

    // tell backend to close Sentry-node instance.
    const { _getGlobal } = this.props;
    const backend = _getGlobal('backend');
    backend.send('sentry:close');

    this._sentry.close();
    this._isInitialized = false;

    log('Closed Sentry.');
  }

  async canInitializeSentry() {

    if (!this.SENTRY_DSN) {
      return {
        result: false,
        msg: 'No DSN set.'
      };
    }

    const isCrashReportsEnabled = await this.isCrashReportsEnabled();

    if (!isCrashReportsEnabled) {

      return {
        result: false,
        msg: 'Crash reports are not enabled.'
      };
    }

    return { result: true };
  }

  async isCrashReportsEnabled() {
    const { config } = this.props;

    const privacyPreferences = await config.get(PRIVACY_PREFERENCES_CONFIG_KEY);

    return !!(privacyPreferences && privacyPreferences[CRASH_REPORTS_CONFIG_KEY]);
  }

  async recheckSentry() {
    const { result } = await this.canInitializeSentry();

    if (result !== this._isInitialized) {

      // Status has changed:
      // The user turned on / off Error Tracking option through
      // Privacy Preferences modal.

      if (result) {
        this.initializeSentry();
      } else {
        this.closeSentry();
      }
    }
  }

  scheduleCheck() {
    setTimeout(() => {
      this.recheckSentry();
      this.scheduleCheck();
    }, this.SCHEDULE_TIME);
  }

  render() {
    return null;
  }
}
