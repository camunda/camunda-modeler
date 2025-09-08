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
import DeployIcon from 'icons/Deploy.svg';

import { generateId } from '../../../util';
import { Fill } from '../../../app/slot-fill';
import { Overlay, Section } from '../../../shared/ui';
import { set } from 'min-dash';
import { event } from 'min-dom';
import { act } from 'react';
import { bootstrapDeployment } from '../../zeebe-plugin/shared/util';
import {
  Radio,

  TextInput,
  ToggleSwitch
} from '../../../shared/ui';
import {
  Field,
  Form,
  Formik
} from 'formik';
import ZeebeAPI from '../../../remote/ZeebeAPI';
import { zeebeAPI } from '../../../remote';

export const VALIDATION_ERROR_MESSAGES = {
  AUDIENCE_MUST_NOT_BE_EMPTY: 'Audience must not be empty.',
  BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY: 'Password must not be empty.',
  BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY: 'Username must not be empty.',
  CLIENT_ID_MUST_NOT_BE_EMPTY: 'Client ID must not be empty.',
  CLIENT_SECRET_MUST_NOT_BE_EMPTY: 'Client Secret must not be empty.',
  CLUSTER_URL_MUST_BE_VALID_CLOUD_URL: 'Must be a valid Camunda 8 SaaS URL.',
  CONTACT_POINT_MUST_BE_URL: 'Cluster endpoint must be a valid URL.',
  CONTACT_POINT_MUST_NOT_BE_EMPTY: 'Cluster endpoint must not be empty.',
  CLUSTER_URL_MUST_NOT_BE_EMPTY: 'Cluster URL must not be empty.',
  CONTACT_POINT_MUST_START_WITH_PROTOCOL: 'Cluster endpoint must start with "http://", "grpc://", "https://", or "grpcs", .',
  MUST_PROVIDE_A_VALUE: 'Must provide a value.',
  OAUTH_URL_MUST_NOT_BE_EMPTY: 'OAuth URL must not be empty.'
};

export default function ConnectionManagerPlugin(props) {
  const {
    getConfig,
    subscribe,
    log,
    settings,
    _getGlobal
  } = props;


  const [ activeTab, setActiveTab ] = useState(null);
  const [ overlayOpen, setOverlayOpen ] = useState(false);
  const [ overlay2Open, setOverlay2Open ] = useState(false);

  const [ connections, setConnections ] = useState([]);
  const [ activeConnection, setActiveConnection ] = useState(null);
  const [ connectionCheckResult, setConnectionCheckResult ] = useState(/** @type {import('../../zeebe-plugin/deployment-plugin/types').ConnectionCheckResult} */ (null));

  const [ {
    connectionChecker,
    deployment,
    deploymentConfigValidator
  }, setDeploymentBootstrapped ] = useState({
    connectionChecker: null,
    deployment: null,
    deploymentConfigValidator: null
  });



  const buttonRef = useRef(null);
  const button2Ref = useRef(null);


  useEffect(() => {

    const zeebeApi = new ZeebeAPI(getConfig('backend'));
    initializeSettings({ ...props, zeebeApi }).then(()=>{
      settings.subscribe('connectionManagerPlugin.c8connections', (connections) => {
        console.log({ connections });
        setConnections(connections.value);
      });
      setConnections(settings.get('connectionManagerPlugin.c8connections'));
    });
  }, [ getConfig, settings, log ]);

  useEffect(() => {
    subscribe('app.activeTabChanged', ({ activeTab }) => {
      setActiveTab(activeTab);
      setOverlayOpen(false);
    });
  }, [ subscribe ]);

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
    (async () => {


      connectionChecker?.updateConfig(activeConnection);


    })();

    connectionChecker?.on('connectionCheck', (a)=>{
      setConnectionCheckResult(a);
      console.log(a);
    }
    );

    return () => {
      connectionChecker?.off('connectionCheck', setConnectionCheckResult);

      connectionChecker?.stopChecking();
    };
  }, [ connectionChecker, deployment, setConnectionCheckResult ]);


  function fillClicked() {
    setOverlayOpen(!overlayOpen);
  }

  function fill2Clicked() {
    setOverlay2Open(!overlay2Open);
  }

  return <>
    { tabNeedsConnection(activeTab) &&
      <Fill name="connection-manager" slot="status-bar__file" group="7_connection">
        <button
          onClick={ fillClicked }
          title="Open file deployment"
          className={ classNames('btn', { 'btn--active': overlayOpen }) }
          ref={ buttonRef }

        >

          { (connectionCheckResult?.success === false) && <ErrorFilled className="status-icon" fill="red" /> }
          { (connectionCheckResult?.success === true) && <CheckmarkFilled className="status-icon" fill="green" /> }
          { (!connectionCheckResult) && <CircleFilled className="status-icon" fill="gray" /> }
          <p style={ { marginLeft:'4px' } }>{activeConnection?.name || activeConnection?.url || 'Manage Connections'}     {connectionCheckResult?.success}</p>

        </button>
      </Fill>
    }
    { overlayOpen && <Overlay onClose={ fillClicked } anchor={ buttonRef.current }>
      <ConnectionManagerOverlay
        connections={ connections }
        connectionCheckResult={ connectionCheckResult }
        activeConnection={ activeConnection }
        onChange={ (connectionId)=> {
          console.log(connectionId);

          const b = (connections.find(conn => conn.id === connectionId));
          console.log({ b });

          setActiveConnection(b);

          setConnectionCheckResult(null);
          connectionChecker?.updateConfig({
            endpoint: b });
        }
        } />
    </Overlay> }



    { tabNeedsConnection(activeTab) &&
      <Fill name="connection-manager2" slot="status-bar__file" group="9_connection">
        <button
          onClick={ fill2Clicked }
          title="Open file deployment"
          className={ classNames('btn', { 'btn--active': overlay2Open }) }
          ref={ button2Ref }

        >

          <DeployIcon className="icon" /> 2
        </button>
      </Fill>
    }
    { overlay2Open && <Overlay onClose={ fill2Clicked } anchor={ button2Ref.current }>
      <Section>
        <Section.Header>Deploy or start</Section.Header>
        <Section.Body>
          <fieldset className="fieldset">
            <div className="fields">

              <div className="form-group">
                <label>
                  TenantId

                </label>
                <input

                  type="text"


                  className={ classNames('form-control') }

                  placeholder={ 'Optional' }

                />

              </div>


            </div>
          </fieldset>
          <Section.Actions>
            <button
              type="submit"
              className="btn btn-primary"

            >
              Deploy
            </button>
          </Section.Actions>


          <hr />
          <fieldset className="fieldset">
            <div className="fields">

              <div className="form-group">
                <label>
                  Variables

                </label>
                <input

                  type="text"


                  className={ classNames('form-control') }

                  placeholder={ '{ }' }

                />

              </div>


            </div>
          </fieldset>
          <Section.Actions>
            <button
              type="submit"
              className="btn btn-primary"

            >
              Deploy & Start
            </button>
          </Section.Actions>

        </Section.Body>
      </Section>
    </Overlay> }
  </>;
}

/**
 * Initialize plugin settings with connection configuration schema.
 *
 * This function registers a comprehensive settings schema for managing Camunda 8 connections,
 * supporting both SaaS and Self-Managed deployments with various authentication methods.
 *
 * @param {Object} params
 * @param {Object} params.settings - Settings manager instance
 * @param {Function} params.getConfig - Function to get configuration values
 * @param {Function} params.log - Logging function
 *
 * @example
 * // Settings structure that will be registered:
 * {
 *   id: 'connectionManagerPlugin',
 *   title: 'Connections',
 *   properties: {
 *     'connectionManagerPlugin.c8connections': {
 *       type: 'array',
 *       childProperties: {
 *         name: { type: 'text', label: 'Name' },
 *         targetType: {
 *           type: 'radio',
 *           options: [
 *             { value: 'camundaCloud', label: 'Camunda 8 SaaS' },
 *             { value: 'selfHosted', label: 'Camunda 8 Self-Managed' }
 *           ]
 *         }
 *         // ... other connection properties
 *       }
 *     }
 *   }
 * }
 */
async function initializeSettings({ settings, getConfig, log }) {
  console.log(
    { settings }
  );
  const pluginSettings = {
    id: 'connectionManagerPlugin',
    title: 'Connections',
    properties: {
      'connectionManagerPlugin.c8connections': {
        type: 'array',
        label: 'Camunda8',
        description: 'Connections to Camunda 8',
        documentationUrl: 'https://docs.camunda.io/docs/apis-tools/camunda-8-api/overview/',
        constraints:{
          custom: (zeebeAPI)=> (values, something) => {console.log({ zeebeAPI, values, something }); return null; }
        },
        formConfig: {
          placeholder: 'No connections',
          addLabel: 'Add Connection',
          elementGenerator: ()=>{
            return {
              id: generateId()
            };
          }
        },

        childProperties:{
          name:{
            type: 'text',
            label: 'Name',
          },

          targetType: {
            type: 'radio',
            label: 'Target',
            options: [
              { value: 'camundaCloud', label: 'Camunda 8 SaaS' },
              { value: 'selfHosted', label: 'Camunda 8 Self-Managed' }
            ],
            default: 'camundaCloud',
          },


          camundaCloudClusterUrl: {
            type: 'text',
            label: 'ClusterUrl',
            condition: { property: 'targetType', equals: 'camundaCloud' },
            constraints: {
              notEmpty: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_NOT_BE_EMPTY,
              pattern: {
                value: /^((https|grpcs):\/\/|)[a-z\d-]+\.[a-z]+-\d+\.zeebe\.camunda\.io(:443|)\/?/,
                message: VALIDATION_ERROR_MESSAGES.CLUSTER_URL_MUST_BE_VALID_CLOUD_URL
              }
            }
          },
          camundaCloudClientId: {
            type: 'text',
            label: 'Client ID',
            condition: { property: 'targetType', equals: 'camundaCloud' },
            constraints: {
              notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY
            }
          },
          camundaCloudClientSecret: {
            type: 'password',
            label: 'Client Secret',
            condition: { property: 'targetType', equals: 'camundaCloud' },
            constraints: {
              notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY
            }
          },

          contactPoint: {
            type: 'text',
            label: 'Cluster endpoint',
            condition: { property: 'targetType', equals: 'selfHosted' },
            constraints: {
              notEmpty: VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_NOT_BE_EMPTY,
              pattern: {
                value: /^(http|grpc)s?:\/\//,
                message: VALIDATION_ERROR_MESSAGES.CONTACT_POINT_MUST_BE_URL
              }
            },

            authType: {
              type: 'radio',
              label: 'Authentication',
              options: [
                { value: 'none', label: 'None' },
                { value: 'basic', label: 'Basic' },
                { value: 'oauth', label: 'OAuth 2.0' },
              ],
              default: 'none',
              condition: { property: 'targetType', equals: 'selfHosted' }
            },

            basicAuthPassword: {
              type: 'text',
              label: 'Username',
              condition: {
                allMatch: [
                  { property: 'targetType', equals: 'selfHosted' },
                  { property: 'authType', equals: 'basic' }
                ]
              },
              constraints: {
                notEmpty: VALIDATION_ERROR_MESSAGES.BASIC_AUTH_USERNAME_MUST_NOT_BE_EMPTY
              }
            },
            basicAuthUsername: {
              type: 'password',
              label: 'Password',
              condition: {
                allMatch: [
                  { property: 'targetType', equals: 'selfHosted' },
                  { property: 'authType', equals: 'basic' }
                ]
              },
              constraints: {
                notEmpty: VALIDATION_ERROR_MESSAGES.BASIC_AUTH_PASSWORD_MUST_NOT_BE_EMPTY
              }
            },

            clientId:{
              type: 'text',
              label: 'Client ID',
              condition: {
                allMatch: [
                  { property: 'targetType', equals: 'selfHosted' },
                  { property: 'authType', equals: 'oauth' }
                ]
              },
              constraints: {
                notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_ID_MUST_NOT_BE_EMPTY
              }
            },
            clientSecret:{
              type: 'password',
              label: 'Client Secret',
              condition: {
                allMatch: [
                  { property: 'targetType', equals: 'selfHosted' },
                  { property: 'authType', equals: 'oauth' },
                ]
              },
              constraints: {
                notEmpty: VALIDATION_ERROR_MESSAGES.CLIENT_SECRET_MUST_NOT_BE_EMPTY
              }
            },
            oauthURL:{
              type: 'text',
              label: 'OAuth token URL',
              condition: {
                allMatch: [
                  { property: 'targetType', equals: 'selfHosted' },
                  { property: 'authType', equals: 'oauth' },
                ]
              },
              constraints: {
                notEmpty: VALIDATION_ERROR_MESSAGES.OAUTH_URL_MUST_NOT_BE_EMPTY
              }
            },
            audience:{
              type: 'text',
              label: 'OAuth audience',
              condition: {
                allMatch: [
                  { property: 'targetType', equals: 'selfHosted' },
                  { property: 'authType', equals: 'oauth' },
                ]
              },
              constraints: {
                notEmpty: VALIDATION_ERROR_MESSAGES.AUDIENCE_MUST_NOT_BE_EMPTY
              }
            },
            scope:{
              type: 'text',
              label: 'OAuth scope',
              condition: {
                allMatch: [
                  { property: 'targetType', equals: 'selfHosted' },
                  { property: 'authType', equals: 'oauth' },
                ]
              },
              constraints: {
                notEmpty: VALIDATION_ERROR_MESSAGES.SCOPE_MUST_NOT_BE_EMPTY
              }
            }
          }
        }
      }
    }
  };

  try {
    settings.register(pluginSettings);
  } catch (error) {
    log('Error registering plugin settings:', error);
  }



  const c8connections = settings.get('connectionManagerPlugin.c8connections');
  if (!c8connections) {
    log('No connections configured, importing legacy');
    const zeebeEndpoints = await getConfig('zeebeEndpoints');
    console.log(zeebeEndpoints);
    settings.set({ 'connectionManagerPlugin.c8connections':  zeebeEndpoints || [ DEFAULT_ENDPOINT ] });
  }

}

function ConnectionManagerOverlay({ connections, onChange, connectionCheckResult, activeConnection }) {
  function getUrl(connection) {
    if (connection.targetType === 'selfHosted') {
      return connection.contactPoint;
    }
    if (connection.targetType === 'camundaCloud') {
      return connection.camundaCloudClusterUrl;
    }
  }
  return (
    <Section>
      <Section.Header>
        Select Connection
      </Section.Header>
      <Section.Body>
        <p>  TODO Text: Select a connection for the current opened file.</p>
        <div className="form-group" style={ { marginTop:'16px' } }>
          {connectionCheckResult?.success === false && <p>There seems to be a problem with your connection. {connectionCheckResult?.reason}</p>}
          <select name="connection" className="form-control" value={ activeConnection?.id } onChange={ (event) => onChange(event.target.value) }>
            {connections?.map(connection => (
              <option key={ connection.id } value={ connection.id } title={ getUrl(connection) }>
                {connection.name ? connection.name : `Unnamed (${getUrl(connection)})`}
              </option>
            ))}
          </select>
        </div>
      </Section.Body>
    </Section>
  );
}


const DEFAULT_ENDPOINT = {
  name: 'c8run (local)',
  url: 'grpc://localhost:26500',
  target: 'camunda8-sm',
  auth: 'none',
};

/**
 * @param {{ type: string; }} tab
 */
function tabNeedsConnection(tab) {
  return tab && [ 'cloud-bpmn', 'cloud-dmn', 'cloud-form', 'rpa' ].includes(tab.type);
}