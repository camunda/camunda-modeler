/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import PrivacyPreferencesView from './PrivacyPreferencesView';

import Flags, { DISABLE_REMOTE_INTERACTION } from '../../util/Flags';

const CONFIG_KEY = 'editor.privacyPreferences';

class NoopComponent extends PureComponent {
  render() {
    return null;
  }
}

export default class PrivacyPreferences extends PureComponent {

  constructor(props) {
    super(props);
    if (Flags.get(DISABLE_REMOTE_INTERACTION)) {
      return new NoopComponent();
    }
  }

  state = {
    showModal: false,
    isInitialPreferences: false,
    preferences: null
  }

  async componentDidMount() {
    const {
      config
    } = this.props;

    let result = await config.get(CONFIG_KEY);
    if (!result) {
      this.setState({
        showModal: true,
        isInitialPreferences: true
      });
    }

    this.props.subscribe('show-privacy-preferences', async (context) => {
      const {
        autoFocusKey
      } = context;

      let preferences = await config.get(CONFIG_KEY);
      this.setState({
        autoFocusKey,
        showModal: true,
        isInitialPreferences: false,
        preferences: preferences
      });
    });
  }

  onClose = () => {
    this.setState({
      showModal: false
    });
  }

  onSaveAndClose = (preferences) => {
    this.props.config.set(CONFIG_KEY, preferences)
      .then(() => this.emit('privacy-preferences.changed', preferences));

    this.onClose();
  }

  emit(event, payload) {
    this.props.triggerAction('emit-event', { type: event, payload });
  }

  render() {
    const {
      autoFocusKey,
      showModal,
      isInitialPreferences,
      preferences
    } = this.state;

    return <React.Fragment>
      { showModal &&
        <PrivacyPreferencesView
          autoFocusKey={ autoFocusKey }
          onClose={ this.onClose }
          preferences={ preferences }
          onSaveAndClose={ this.onSaveAndClose }
          canCloseWithoutSave={ !isInitialPreferences } />
      }
    </React.Fragment>;
  }
}
