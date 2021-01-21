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
            Periodic checks for new updates are currently <b>disabled</b>.
          </p>
          <p>
            <a href="#" onClick={ onOpenPrivacyPreferences }>
              Open the Privacy Preferences
            </a>
            {' '} to enable them.
          </p>
        </div>
      )
    );
  }
}