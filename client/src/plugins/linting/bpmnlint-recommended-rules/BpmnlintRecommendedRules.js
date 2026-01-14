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

import {
  registerClientPlugin
} from 'camunda-modeler-plugin-helpers';

import recommendedRules from './.bpmnlintrc';

const CONFIG_KEY = 'editor.bpmnlintEnabled';

/**
 * Plugin that conditionally registers bpmnlint recommended rules based on settings.
 */
export default class BpmnlintRecommendedRules extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      registered: false
    };
  }

  async componentDidMount() {
    const {
      config
    } = this.props;

    // Check if bpmnlint is enabled in settings (default: true)
    const bpmnlintEnabled = await config.get(CONFIG_KEY, true);

    if (bpmnlintEnabled) {
      this.registerLintRules();
    }

    // Subscribe to config changes to allow toggling at runtime
    const { subscribe } = this.props;

    if (subscribe) {
      subscribe('config.changed', ({ key }) => {
        if (key === CONFIG_KEY) {
          this.handleConfigChange();
        }
      });
    }
  }

  async handleConfigChange() {
    const {
      config
    } = this.props;

    const bpmnlintEnabled = await config.get(CONFIG_KEY, true);

    if (bpmnlintEnabled && !this.state.registered) {
      this.registerLintRules();
    }
    // Note: We don't unregister rules if disabled because that would require
    // re-initializing the modeler. The setting takes effect on next app restart.
  }

  registerLintRules() {
    registerClientPlugin(recommendedRules, 'lintRules.bpmn');
    registerClientPlugin(recommendedRules, 'lintRules.cloud-bpmn');

    this.setState({ registered: true });
  }

  render() {
    return null;
  }
}
