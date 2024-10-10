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
        <div className="settings-container">
          <h1>Settings</h1>

          <p>
            Configure the look and feel of the editor.
          </p>

          <section>
            <h2>Canvas</h2>

            <p>
              <div className="alert-warning">
                This setting is overridden via a <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags">feature flag</a>.
              </div>

              <label><input type="checkbox" /> Enable <a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/#enable-new-context-pad">improved context pad</a>.</label>
            </p>
          </section>

          <section>
            <h2>Connectors</h2>

            <p>
              <label><input type="checkbox" /> Make <a href="https://docs.camunda.io/docs/next/components/modeler/desktop-modeler/use-connectors/">Camunda Connectors</a> available.</label>
            </p>
          </section>

          <section>
            <h2>Startup Flags</h2>

            <p><a href="https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags">Feature flags</a> recognized at application startup, overriding local settings:</p>

            <pre>
              { JSON.stringify(Flags.data, 0, 2) }
            </pre>
          </section>
        </div>
      </Tab>
    );
  }
}
