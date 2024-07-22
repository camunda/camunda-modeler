/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment, PureComponent } from 'react';

const DOCUMENTATION_URL = 'https://docs.camunda.io/docs/components/modeler/desktop-modeler/use-connectors/';

export default class ConnectorTemplates extends PureComponent {
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
      subscribe,
      triggerAction
    } = this.props;

    subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.setState({ activeTab });
    });

    getGlobal('backend').on('client:connector-templates-update-success', (_, hasNew, warnings = []) => {
      const { activeTab } = this.state;

      if (activeTab && activeTab.type === 'cloud-bpmn') {
        triggerAction('elementTemplates.reload');
      }

      if (warnings.length) {
        displayNotification({
          type: 'warning',
          title: 'Camunda Connector templates updated with warnings',
          content: warnings.map((warning, index) => (
            <Fragment key={ index }>
              { warning }
              { index === warnings.length - 1 ? null : <br /> }
              <br />
              <a href={ DOCUMENTATION_URL }>Learn more</a>
            </Fragment>
          ))
        });

        return;
      }

      displayNotification({
        type: 'success',
        title: hasNew ? 'Camunda Connector templates updated' : 'Camunda Connector templates up to date',
        content: <a href={ DOCUMENTATION_URL }>Learn more</a>
      });
    });

    getGlobal('backend').on('client:connector-templates-update-error', (_, message) => {
      displayNotification({
        type: 'error',
        title: 'Error updating Camunda Connector templates',
        content: <Fragment>
          <span>{ message }</span>
          <br />
          <a href={ DOCUMENTATION_URL }>Learn more</a>
        </Fragment>
      });
    });
  }

  render() {
    return null;
  }
}
