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

import * as css from './SettingsTab.less';

import {
  Tab
} from './primitives';

import Flags, { DISABLE_DMN, DISABLE_FORM, DISABLE_ZEEBE, DISABLE_PLATFORM } from '../util/Flags';


export default class SettingsTab extends PureComponent {

  componentDidMount() {
    this.props.onShown();
  }

  triggerAction() { }

  render() {

    return (
      <Tab className={ css.SettingsTab }>
        <h1>This is the settings page</h1>

        <p>
          Lorem ipsum foo bar wat.
        </p>

        <h3>Startup Flags</h3>

        <pre>
          { JSON.stringify(Flags.data, 0, 2) }
        </pre>
      </Tab>
    );
  }
}
