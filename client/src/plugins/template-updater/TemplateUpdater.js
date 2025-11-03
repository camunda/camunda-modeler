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

import { utmTag } from '../../util/utmTag';


const DOCUMENTATION_URL = utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/use-connectors/');

export default class TemplateUpdater extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: null
    };
  }

  componentDidMount() {
    const {
      _getGlobal: getGlobal,
      displayNotification,
      log,
      subscribe,
      triggerAction
    } = this.props;

    subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({ activeTab });
    });

    subscribe('tab.engineProfileChanged', ({ executionPlatform, executionPlatformVersion }) => {
      if (!executionPlatform || !executionPlatformVersion) {
        return;
      }

      getGlobal('backend').send('client:templates-update', {
        executionPlatform,
        executionPlatformVersion
      });
    });

    getGlobal('backend').on('client:templates-update-done', (_, hasNew, warnings = []) => {
      const { activeTab } = this.state;

      if (activeTab && activeTab.type === 'cloud-bpmn' && hasNew) {
        triggerAction('elementTemplates.reload');
      }

      if (warnings.length) {
        warnings.forEach((warning) => {
          log({
            category: 'templates-update-error',
            message: warning,
            silent: true
          });
        });

        displayNotification({
          type: 'warning',
          title: 'Camunda Connector templates updated with errors',
          content: <button
            onClick={ () => triggerAction('open-log') }>
            See the log for further details
          </button>
        });

        return;
      }

      if (hasNew) {
        displayNotification({
          type: 'success',
          title: 'Camunda Connector templates updated',
          content: <a href={ DOCUMENTATION_URL }>Learn more</a>
        });
      }
    });
  }

  render() {
    return null;
  }
}
