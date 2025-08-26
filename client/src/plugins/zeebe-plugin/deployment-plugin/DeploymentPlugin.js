/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import classNames from 'classnames';

import { Fill } from '../../../app/slot-fill';

import { bootstrapDeployment } from '../shared/util';

import DeploymentPluginOverlay from './DeploymentPluginOverlay';

import { CheckmarkFilled, ErrorFilled } from '@carbon/icons-react';
import DeployIcon from 'icons/Deploy.svg';

import * as css from './DeploymentPlugin.less';


export default function DeploymentPlugin(props) {
  const {
    _getFromApp,
    _getGlobal,
    displayNotification,
    log,
    subscribe,
    triggerAction,
    settings
  } = props;

  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);
  const [ connections, setConnections ] = useState([]);

  console.log('settings', settings);

  const pluginSettings = {
    id: 'connectionPlugin',
    title: 'Connections',
    properties: {

      // // radio button for camunda 7, camunda 8 (SM), and camunda 8 (SaaS)
      // 'testClientPlugin.connectionType': {
      //   type: 'radio',
      //   style: 'vertical',

      //   default: 'camunda8-sm',
      //   label: 'Target',
      //   options: [
      //     { value: 'camunda8-sm', label: 'Camunda 8 SaaS' },
      //     { value: 'camunda8-saas', label: 'Camunda 8 Self-Managed' },
      //     { value: 'camunda7', label: 'Camunda 7' },
      //   ],

      //   // restartRequired: true,
      //   documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/'
      // },




      'connectionPlugin.connections': {
        type: 'array',
        label: 'Connections',
        description: 'Connections to Camunda 7 or Camunda 8',
        documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/',
        formConfig: {
          placeholder: 'No connections',
          addLabel: 'Add Connection',
        },
        childProperties:{
          name:{
            type: 'text',
            label: 'Name',
            default: 'My Connection'

          },
          url: {
            type: 'text',
            label: 'URL',
            default: 'https://api.camunda.io',
            documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/'
          },
          target: {
            type: 'radio',
            options: [
              { value: 'camunda8-saas', label: 'Camunda 8 SaaS' },
              { value: 'camunda8-sm', label: 'Camunda 8 SM' },
              { value: 'camunda7', label: 'Camunda 7' },
            ],
            default: 'camunda8-sm',
            label: 'Target',
          },

          auth: {
            type: 'radio',
            options: [
              { value: 'none', label: 'None' },
              { value: 'basic', label: 'Basic' },
              { value: 'cookie', label: 'Cookie' },
              { value: 'oauth2', label: 'OAuth 2.0' },
            ],
            default: 'none',
            label: 'Auth',
            condition:{
              property: 'target',
              equals: 'camunda8-sm'
            }
          },
          username: {
            type: 'text',
            label: 'Username',
            condition:{
              allMatch:[
                { property: 'auth', oneOf: [ 'basic', 'cookie' ] },
                { property: 'target', equals:  'camunda8-sm' }
              ]


            }
          },
          password: {
            type: 'text',
            label: 'Password',
            condition:{
              property: 'auth',
              oneOf: [ 'basic', 'cookie' ]
            }
          }
        }
      }
    }
  };

  // try {
  //   settings.register(pluginSettings);
  // } catch (error) {
  //   console.error('Error registering plugin settings:', error);
  // }



  // setConnections(settings.get('connectionPlugin.connections'));

  settings.subscribe('testClientPlugin.connections', ({ value }) => {
    console.log('connections', value);
    setConnections(value);
  });
  const [ {
    connectionChecker,
    deployment,
    deploymentConfigValidator
  }, setDeploymentBootstrapped ] = useState({
    connectionChecker: null,
    deployment: null,
    deploymentConfigValidator: null
  });

  const anchorRef = useRef();

  const onClick = async () => {
    if (overlayOpen) {
      setOverlayOpen(false);

      return;
    }

    const saved = await triggerAction('save-tab', { tab: activeTab });

    if (!saved) {
      return;
    }

    setOverlayOpen(true);
  };

  useEffect(() => {
    const {
      connectionChecker,
      deployment,
      deploymentConfigValidator
    } = bootstrapDeployment(_getGlobal('backend'), _getGlobal('config'));

    setDeploymentBootstrapped({
      connectionChecker,
      deployment,
      deploymentConfigValidator
    });

    return () => {
      connectionChecker.stopChecking();
    };
  }, [ _getGlobal ]);

  useEffect(() => {
    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);

      setOverlayOpen(false);
    });
  }, [ subscribe ]);

  if (!activeTab || !connectionChecker || !deployment || !deploymentConfigValidator) {
    return null;
  }

  const tabsProvider = _getFromApp('props').tabsProvider;

  const TabIcon = tabsProvider.getTabIcon(activeTab.type) || (() => null);

  const tabName = tabsProvider.getProvider(activeTab.type)?.name || 'file';




  return <>
    { canDeployTab(activeTab) && (
      <Fill name="deployment" slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          onClick={ onClick }
          title="Open file deployment"
          className={ classNames('btn', css.DeploymentPlugin, { 'btn--active': overlayOpen }) }
          ref={ anchorRef }
        >
          <ErrorFilled className="status-icon" fill="red" /> <p style={ { marginLeft:'4px' } }>c8run local</p>
        </button>
      </Fill>
    ) }
    { overlayOpen && (
      <DeploymentPluginOverlay
        _getFromApp={ _getFromApp }
        activeTab={ activeTab }
        anchor={ anchorRef.current }
        connectionChecker={ connectionChecker }
        deployment={ deployment }
        deploymentConfigValidator={ deploymentConfigValidator }
        displayNotification={ displayNotification }
        log={ log }
        onClose={ () => setOverlayOpen(false) }
        renderHeader={ <><TabIcon width="16" height="16" />Deploy { tabName }</> }
        renderSubmit={ `Deploy ${ tabName }` }
        triggerAction={ triggerAction }
        connections={ connections }
      />
    ) }
  </>;
}

function canDeployTab(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}