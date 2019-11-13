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

import View from './PrivacyPreferencesView';

class PrivacyPreferencesModal extends PureComponent {
  constructor(props) {
    super(props);

    this.preferences = props.privacyPreferences ? { ...props.privacyPreferences } : {
      ENABLE_CRASH_REPORTS: true,
      ENABLE_USAGE_STATISTICS: true,
      ENABLE_UPDATE_CHECKS: true
    };
  }

  isEnabled = (key) => {
    return this.preferences[key];
  }

  onSaveAndClose = (preferences) => {
    for (let key in preferences) {
      this.preferences[key] = preferences[key];
    }
    this.props.setPrivacyPreferences(this.preferences);
    this.props.onClose();
  }

  render() {
    const {
      onClose,
      privacyPreferences
    } = this.props;

    const {
      isEnabled,
      preferences,
      onSaveAndClose
    } = this;

    return (
      <View
        onClose={ onClose }
        onSaveAndClose={ onSaveAndClose }
        isEnabled={ isEnabled }
        preferences={ preferences }
        hasCancel={ !!privacyPreferences } />
    );
  }
}

export default PrivacyPreferencesModal;
