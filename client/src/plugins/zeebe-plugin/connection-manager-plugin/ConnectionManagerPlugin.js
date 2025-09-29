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

import { CheckmarkFilled, ErrorFilled, CircleFilled } from '@carbon/icons-react';


import { Fill } from '../../../app/slot-fill';
import { Overlay, Section, Select } from '../../../shared/ui';
import { bootstrapDeployment, getMessageForReason, getResourceType } from '../../zeebe-plugin/shared/util';

import { initializeSettings } from './ConnectionManagerSettings';

import {
  Field,
  Form,
  Formik
} from 'formik';
import { getErrorNotification, getSuccessNotification } from '../deployment-plugin/DeploymentNotifications';

import * as css from './ConnectionManagerPlugin.less';

export default function ConnectionManagerPlugin(props) {

  const {
    _getFromApp,
    getConfig,
    subscribe,
    log,
    settings,
    config,
    triggerAction,
    displayNotification,
    _getGlobal,
    connectionCheckResult,
    setConnectionCheckResult

  } = props;


  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);

  const [ connections, setConnections ] = useState([]);
  const [ activeConnection, setActiveConnection ] = useState(null);

  const [ {
    connectionChecker,
    deployment,
  }, setDeploymentBootstrapped ] = useState({
    connectionChecker: null,
    deployment: null
  });



  const statusBarButtonRef = useRef(null);


  useEffect(() => {
    initializeSettings({ settings, getConfig, log }).then(()=>{
      settings.subscribe('connectionManagerPlugin.c8connections', (connections) => {
        setConnections(connections.value);
      });
      setConnections(settings.get('connectionManagerPlugin.c8connections'));
    });
  }, [ settings, getConfig, log ]);

  useEffect(() => {
    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);
      setOverlayOpen(false);

    });
  }, [ subscribe ]);

  useEffect(() => {
    const {
      connectionChecker,
      deployment
    } = bootstrapDeployment(_getGlobal('backend'), _getGlobal('config'), _getGlobal('settings'));

    setDeploymentBootstrapped({
      connectionChecker,
      deployment
    });

    return () => {
      connectionChecker.stopChecking();
    };
  }, [ _getGlobal ]);

  useEffect(() => {
    (async () => {
      setConnectionCheckResult(null);
      if (activeConnection) {
        connectionChecker?.updateConfig({ endpoint: activeConnection });
      }
    })();

    connectionChecker?.on('connectionCheck', (connectionCheckResult)=>{
      setConnectionCheckResult(connectionCheckResult);
    });

    return () => {
      connectionChecker?.off('connectionCheck', setConnectionCheckResult);
      connectionChecker?.stopChecking();
    };
  }, [ connectionChecker, deployment, setConnectionCheckResult, activeConnection ]);

  useEffect(() => {
    if (!activeTab) {
      return;
    }

    config.getForFile(activeTab.file, 'connectionId').then(({ connectionId }) => {
      if (!connectionId) {
        setActiveConnection(connections[0]);
      }
      else {
        const connection = connections.find(conn => conn.id === connectionId) || connections[0];
        setActiveConnection(connection);
      }
    });
  },
  [ activeTab ]);

  function fillClicked() {
    setOverlayOpen(!overlayOpen);
  }

  const tabsProvider = _getFromApp('props').tabsProvider;
  const TabIcon = activeTab ? tabsProvider.getTabIcon(activeTab?.type) || (() => null) : (() => null);

  return <>
    { tabNeedsConnection(activeTab) &&
      <Fill name="connection-manager" slot="status-bar__file" group="8_deploy" priority={ 2 }>
        <button
          onClick={ fillClicked }
          title="Open file deployment"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ statusBarButtonRef }
        >

          { (connectionCheckResult?.success === false) && <ErrorFilled fill="var(--color-red-360-100-45)" /> }
          { (connectionCheckResult?.success === true) && <CheckmarkFilled fill="var(--color-green-150-86-44)" /> }
          { (!connectionCheckResult) && <CircleFilled fill="var(--color-grey-225-10-35)" /> }

          <p style={ { marginLeft:'4px' } }>{activeConnection?.name || activeConnection?.url || 'Select Connection'}</p>

        </button>
      </Fill>
    }
    { overlayOpen && <Overlay className={ css.ConnectionManagerOverlay } onClose={ fillClicked } anchor={ statusBarButtonRef.current }>

      <ConnectionManagerOverlay
        connections={ connections }
        connectionCheckResult={ connectionCheckResult }
        renderHeader={ <><TabIcon width="16" height="16" />Select connection</> }
        activeConnection={ activeConnection }
        handleManageConnections={ () => {
          setOverlayOpen(false);
          triggerAction('settings-open');
        } }
        handleConnectionChange={ (connectionId)=> {
          config.setForFile(activeTab.file, 'connectionId', {
            connectionId
          });


          const connection = (connections.find(conn => conn.id === connectionId));
          setActiveConnection(connection);
        }
        }
        handleDeploy={ async (...a)=> {
          const resourceConfigs = getResourceConfigs(activeTab);
          const file = getConfigFile(activeTab);

          const config = await deployment.getConfigForFile(file);
          deployment.deploy(resourceConfigs, {
            deployment:{

            },
            endpoint: activeConnection
          }).then((deploymentResponse)=>{

            if (deploymentResponse.success) {
              displayNotification(getSuccessNotification(activeTab, config, deploymentResponse));
            } else {
              displayNotification(getErrorNotification(triggerAction));
            }

          });
        } }
      />
    </Overlay>
    }
  </>;
}

function getConfigFile(activeTab) {
  const { file } = activeTab;

  return file;
}

function ConnectionManagerOverlay({
  connections,
  handleConnectionChange,
  connectionCheckResult,
  activeConnection,
  handleManageConnections,
  handleDeploy,
  renderHeader
}) {
  function getUrl(connection) {
    if (connection.targetType === 'selfHosted') {
      return connection.contactPoint;
    }
    if (connection.targetType === 'camundaCloud') {
      return connection.camundaCloudClusterUrl;
    }
  }

  return (
    <Formik
      initialValues={ {} }
      onSubmit={ handleDeploy }
    >
      {
        props=>{
          return (
            <Form onChange={ (event) => {
              if (event.target.name === 'connection') {
                handleConnectionChange(event.target.value);
              }
            } }>


              <Section>
                <Section.Header className="form-header">
                  {renderHeader}
                </Section.Header>
                <Section.Body className="form-body">
                  <p>Select a connection for the currently open file.</p>
                  <div className="form-group" style={ { marginTop:'16px' } }>

                    <div style={ { width:'100%', textAlign: 'right' } }>
                      <a style={ { color:'var(--link-color)', cursor: 'pointer' } } onClick={ handleManageConnections }>
                        Manage connections
                      </a>
                    </div>

                    <div>
                      <Field
                        component={ Select }
                        options={ connections?.map(connection => ({
                          value: connection.id,
                          label: connection.name ? connection.name : `Unnamed (${getUrl(connection)})`
                        })) }
                        placeholder="Please select a connection"
                        fieldError={ ()=>connectionCheckResult?.success === false ? getMessageForReason(connectionCheckResult?.reason) : undefined }
                        name="connection"
                        className="form-control"
                        value={ activeConnection?.id }
                      >
                      </Field>
                    </div>
                  </div>
                </Section.Body>
              </Section>
            </Form>
          );
        }
      }
    </Formik>
  );
}


/**
 * @param {{ type: string; }} tab
 */
function tabNeedsConnection(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}

function getResourceConfigs(activeTab) {
  const { file } = activeTab;
  return [
    {
      path: file.path,
      type: getResourceType(activeTab)
    }
  ];
}