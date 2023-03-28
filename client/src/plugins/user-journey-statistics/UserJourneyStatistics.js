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

import eventHandlers from './event-handlers';

import React, {
  PureComponent
} from 'react';

import Flags, { MIXPANEL_TOKEN, MIXPANEL_STAGE, DISABLE_REMOTE_INTERACTION } from '../../util/Flags';

import MixpanelHandler from './MixpanelHandler';

const log = debug('UserJourneyStatistics');

const PRIVACY_PREFERENCES_CONFIG_KEY = 'editor.privacyPreferences';
const USAGE_STATISTICS_CONFIG_KEY = 'ENABLE_USAGE_STATISTICS';
const EDITOR_ID_CONFIG_KEY = 'editor.id';

// Mixpanel token and stage is set to our CI provider as an env variable, passed to client via WebPack DefinePlugin
const DEFINED_MIXPANEL_TOKEN = process.env.MIXPANEL_TOKEN;
const DEFINED_MIXPANEL_STAGE = process.env.MIXPANEL_STAGE;

// In order to plug a new event handler:
//
// 1) Create a new event handler class under event-handlers
// 2) This class should use 'track(eventName, payload)' prop method to send events to Mixpanel
// 3) This class should be exported via index.js in order to be recognize by UsageStatistics plugin.
//
// See the example implementation of TabEventHandler.

export default class UserJourneyStatistics extends PureComponent {

  constructor(props) {
    super(props);

    // flags are useful for development.
    this.MIXPANEL_TOKEN = Flags.get(MIXPANEL_TOKEN) || DEFINED_MIXPANEL_TOKEN;
    this.MIXPANEL_STAGE = Flags.get(MIXPANEL_STAGE) || DEFINED_MIXPANEL_STAGE;

    this._buttonRef = React.createRef(null);

    this.mixpanel = MixpanelHandler.getInstance();

    this.state = {
      open: false
    };

    this._eventHandlers = [];

    eventHandlers.forEach((eventHandlerConstructor) => {
      this._eventHandlers.push(new eventHandlerConstructor({
        subscribe: props.subscribe,
        track: this.mixpanel.track.bind(this.mixpanel),
        getGlobal: props._getGlobal,
        config: props.config
      }));
    });
  }

  isEnabled = () => {
    return MixpanelHandler.getInstance().isEnabled();
  };

  enable = () => {
    log('Enabling');

    this.mixpanel.enable(this.MIXPANEL_TOKEN, this._editorID, this.MIXPANEL_STAGE);

    this.emit('telemetry.enabled');
  };

  emit(event, payload) {
    this.props.triggerAction('emit-event', { type: event, payload });
  }

  disable = () => {
    log('Disabling.');

    this.mixpanel.disable();

    this.emit('telemetry.disabled');
  };

  async setEditorId() {
    this._editorID = await this.props.config.get(EDITOR_ID_CONFIG_KEY);

    if (!this._editorID) {
      throw new Error('missing editor id');
    }
  }

  async componentDidMount() {

    // make sure we also set the editor although the plugin is not enabled
    await this.setEditorId();

    if (!this.MIXPANEL_TOKEN) {
      return log('Not enabled: Mixpanel project token not configured.');
    }

    if (!this.MIXPANEL_STAGE) {
      return log('Not enabled: Mixpanel stage not configured.');
    }

    if (Flags.get(DISABLE_REMOTE_INTERACTION)) {
      return log('Not enabled: Remote interaction disabled.');
    }

    // If remote interaction is not disabled via flags:
    // -> The user may turn on / off usage statistics on the run
    // -> The user may never actually restart the modeler.
    this.props.subscribe('privacy-preferences.changed', this.handlePrivacyPreferencesChanged);

    const isUsageStatisticsEnabled = await this.isUsageStatisticsEnabled();

    if (!isUsageStatisticsEnabled) {
      return log('Not enabled: Usage statistics are turned off via Privacy Preferences.');
    }

    this.enable();
  }

  async isUsageStatisticsEnabled() {
    const { config } = this.props;

    const privacyPreferences = await config.get(PRIVACY_PREFERENCES_CONFIG_KEY);

    return !!(privacyPreferences && privacyPreferences[USAGE_STATISTICS_CONFIG_KEY]);
  }

  handlePrivacyPreferencesChanged = async () => {
    const isUsageStatisticsEnabled = await this.isUsageStatisticsEnabled();

    if (isUsageStatisticsEnabled) {
      return this.enable();
    }

    return this.disable();
  };

  toggle = () => {
    this.setState(state => ({ ...state, open: !state.open }));
  };

  render() {
    return null;
  }
}