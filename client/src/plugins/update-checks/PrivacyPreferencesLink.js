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

export default class PrivacyPreferencesLink extends PureComponent {

  render() {
    const {
      updateChecksEnabled,
      onOpenPrivacyPreferences
    } = this.props;

    return (
      !updateChecksEnabled && (
        <div>
          <p>
            Periodic update checks are currently <b>disabled</b>. Enable them in the {' '}
            <a href="#" onClick={ onOpenPrivacyPreferences }>
              Privacy Preferences
            </a>.
          </p>
        </div>
      )
    );
  }
}
