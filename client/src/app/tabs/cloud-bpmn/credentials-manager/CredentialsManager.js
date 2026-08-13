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

import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

import {
  CredentialsModal,
  getInitialFieldValues,
  getVisibleProperties,
  buildConfig,
  toFieldValues
} from '../../../modals/credentials';

import { EventsContext } from '../../../EventsContext';

import { NO_CONNECTION_ID } from '../../../../plugins/zeebe-plugin/connection-manager-plugin/constants';

import {
  CONNECTION_CHECK_ERROR_REASONS
} from '../../../../plugins/zeebe-plugin/deployment-plugin/ConnectionCheckErrors';

/**
 * @typedef {Object} ConfigurationInstance
 * @property {string} name - cluster-variable name
 * @property {Object} metadata - credential metadata (kind, configurationTemplate, ...)
 */

/**
 * @typedef {Object} ConfigurationTemplate
 * @property {string} id
 * @property {number} version
 * @property {Array<Object>} properties
 */

/**
 * @typedef {Object} ChooserEvent
 * @property {Object} element - the diagram element that owns the binding
 * @property {Object} property - the Configuration property being edited
 * @property {ConfigurationInstance} [instance] - the currently bound credential, if any
 * @property {string} configurationTemplate - configuration template ID
 * @property {number} configurationTemplateVersion - minimum template version required
 */

const CONFIGURATION_UNAVAILABLE_MESSAGES = {
  noConnection: 'Connect to a Camunda 8 cluster to manage credentials.',
  offline: 'Cannot reach the cluster. Reconnect to manage credentials.',
  unsupported: 'The connected cluster does not support credentials. Camunda 8.10 or later is required.'
};

const CREDENTIAL_SEARCH_FILTER = { metadata: { kind: { '$eq': 'CREDENTIAL' } } };

const CREDENTIAL_REFERENCE_PREFIX = '=camunda.vars.env.';

const CREDENTIAL_VARIABLE_KIND = 'SECRET_REFERENCE';

/**
 * Hosts the element-template credential chooser for a cloud BPMN tab: feeds the
 * `configurationInstances` registry from the connected cluster and drives the
 * create / edit / upgrade modal in response to the chooser's eventBus events.
 */
export default class CredentialsManager extends PureComponent {

  static contextType = EventsContext;

  constructor(props) {
    super(props);

    this.state = { modal: null };

    // last handled connection identity + status; the connection check polls
    // periodically, so we only react to actual switches / offline transitions
    this._lastConnectionKey = null;
  }

  componentDidMount() {
    const eventBus = this.getService('eventBus');

    eventBus.on('configuration.create', this.handleConfigurationCreate);
    eventBus.on('configuration.edit', this.handleConfigurationEdit);
    eventBus.on('configuration.upgrade', this.handleConfigurationUpgrade);

    this._connectionSubscription = this.context.subscribe(
      'connectionManager.connectionStatusChanged',
      this.handleConnectionStatusChanged
    );

    this.updateConfigurationInstances();
  }

  componentWillUnmount() {
    const eventBus = this.getService('eventBus');

    eventBus.off('configuration.create', this.handleConfigurationCreate);
    eventBus.off('configuration.edit', this.handleConfigurationEdit);
    eventBus.off('configuration.upgrade', this.handleConfigurationUpgrade);

    if (this._connectionSubscription) {
      this._connectionSubscription.cancel();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.file !== this.props.file) {
      this.updateConfigurationInstances();
    }
  }

  getService(name, strict = true) {
    return this.props.injector.get(name, strict);
  }

  /**
   * Resolve the cluster endpoint the tab is connected to.
   *
   * @returns {Promise<Object|null>} the endpoint, or null when there is no usable connection
   */
  async getEndpoint() {
    const { deployment, file } = this.props;

    const endpoint = await deployment.getConnectionForTab({ file });

    if (!endpoint || endpoint.id === NO_CONNECTION_ID) {
      return null;
    }

    return endpoint;
  }

  /**
   * Feed the credential chooser's `configurationInstances` registry from the
   * connected cluster, or mark it unavailable when there is no usable connection.
   *
   * @param {Object} [connectionStatus] - latest status from the connection check
   */
  async updateConfigurationInstances(connectionStatus) {
    const configurationInstances = this.getService('configurationInstances', false);

    if (!configurationInstances) {
      return;
    }

    const endpoint = await this.getEndpoint();

    const unavailableState = getUnavailableState(endpoint, connectionStatus);

    if (unavailableState) {
      configurationInstances.setState(unavailableState);

      return;
    }

    configurationInstances.setState({ available: true, loading: true, error: false });

    try {
      await this.loadConfigurationInstances(configurationInstances, endpoint);
    } catch (error) {
      configurationInstances.setState({ loading: false, error: true });
    }
  }

  /**
   * Query the cluster for credential permissions and instances and push the
   * result into the `configurationInstances` registry.
   *
   * @param {Object} configurationInstances - the registry to feed
   * @param {Object} endpoint - the connected cluster endpoint
   */
  async loadConfigurationInstances(configurationInstances, endpoint) {
    const { zeebeApi } = this.props;

    const [ authorizationsResult, variablesResult ] = await Promise.all([
      zeebeApi.getAuthorizations({ endpoint }, 'CLUSTER_VARIABLE'),
      zeebeApi.searchClusterVariables({ endpoint }, CREDENTIAL_SEARCH_FILTER)
    ]);

    if (!variablesResult.success) {
      configurationInstances.setState(getConfigurationUnavailableState(variablesResult));

      return;
    }

    const selectableInstances = toSelectableInstances(variablesResult.response.items);

    const referencedInstances = await this.getReferencedInstances(endpoint, selectableInstances);

    configurationInstances.setState({
      available: true,
      loading: false,
      error: false,
      permissions: getConfigurationPermissions(authorizationsResult),
      selectableInstances,
      referencedInstances
    });
  }

  /**
   * Resolve the credentials referenced by the diagram's Configuration bindings
   * (`=camunda.vars.env.<name>`), reusing the search results where possible and
   * fetching the rest, so the chooser can render "missing" / "incompatible type"
   * / "version too old" states and offer the upgrade action.
   *
   * @param {Object} endpoint
   * @param {ConfigurationInstance[]} selectableInstances
   *
   * @returns {Promise<ConfigurationInstance[]>}
   */
  async getReferencedInstances(endpoint, selectableInstances) {
    const selectableByName = new Map(selectableInstances.map(instance => [ instance.name, instance ]));

    const referencedInstances = [];
    const namesToFetch = [];

    getReferencedCredentialNames(this.getService('elementRegistry')).forEach(name => {
      if (selectableByName.has(name)) {
        referencedInstances.push(selectableByName.get(name));
      } else {
        namesToFetch.push(name);
      }
    });

    const fetched = await Promise.all(
      namesToFetch.map(name => this.props.zeebeApi.getClusterVariable({ endpoint }, name))
    );

    fetched.forEach((result, index) => {
      if (result.success && result.response && result.response.metadata) {
        referencedInstances.push({
          name: namesToFetch[index],
          metadata: result.response.metadata
        });
      }
    });

    return referencedInstances;
  }

  /**
   * React to a cluster connection change, debounced so the periodic connection
   * check only triggers a reload on an actual switch or online/offline change.
   *
   * @param {Object} [connectionStatus]
   */
  handleConnectionStatusChanged = (connectionStatus = {}) => {
    const { connectionId = null, success = null } = connectionStatus;

    const key = `${ connectionId }:${ success }`;

    if (key === this._lastConnectionKey) {
      return;
    }

    this._lastConnectionKey = key;

    this.updateConfigurationInstances(connectionStatus);
  };

  handleConfigurationCreate = (event) => {
    this.openModal('create', event);
  };

  handleConfigurationEdit = (event) => {
    this.openModal('edit', event);
  };

  handleConfigurationUpgrade = (event) => {
    this.openModal('upgrade', event);
  };

  /**
   * Open the credential modal, seeding it with the existing credential's values
   * when editing or upgrading.
   *
   * @param {'create'|'edit'|'upgrade'} mode
   * @param {ChooserEvent} event
   */
  async openModal(mode, event) {
    const configurationTemplate = this.getConfigurationTemplate(event);

    const properties = getTemplateProperties(configurationTemplate);

    let initialValues = getInitialFieldValues(properties);

    try {
      initialValues = await this.getInitialValues(mode, event, properties, initialValues);
    } catch (error) {
      this.props.onError({ error });
    }

    const { instance } = event;

    this.setState({
      modal: {
        mode,
        event,
        configurationTemplate,
        initialValues,
        displayName: getCredentialDisplayName(mode, instance),
        credentialName: getCredentialName(mode, instance)
      }
    });
  }

  /**
   * Resolve the configuration template for a chooser event, preferring the exact
   * requested version and falling back to the latest.
   *
   * @param {ChooserEvent} event
   *
   * @returns {ConfigurationTemplate|null}
   */
  getConfigurationTemplate(event) {
    const configurationTemplates = this.getService('configurationTemplates', false);

    if (!configurationTemplates) {
      return null;
    }

    return configurationTemplates.get(event.configurationTemplate, event.configurationTemplateVersion)
      || configurationTemplates.get(event.configurationTemplate);
  }

  /**
   * Seed the modal's field values from the bound credential's stored value when
   * editing or upgrading; falls back to the given defaults otherwise.
   *
   * @param {'create'|'edit'|'upgrade'} mode
   * @param {ChooserEvent} event
   * @param {Array<Object>} properties
   * @param {Object} initialValues - default field values
   *
   * @returns {Promise<Object>}
   */
  async getInitialValues(mode, event, properties, initialValues) {
    const { instance } = event;

    if (mode === 'create' || !instance) {
      return initialValues;
    }

    const endpoint = await this.getEndpoint();

    if (!endpoint) {
      return initialValues;
    }

    const result = await this.props.zeebeApi.getClusterVariable({ endpoint }, instance.name);

    if (!result.success) {
      return initialValues;
    }

    return {
      ...initialValues,
      ...toFieldValues(properties, result.response.value)
    };
  }

  closeModal = () => {
    this.setState({ modal: null });
  };

  /**
   * Create or update the credential from the modal's input, then close it.
   *
   * @param {{ displayName: string, name: string, values: Object }} formData
   */
  handleSubmit = async ({ displayName, name, values }) => {
    const { mode, event, configurationTemplate } = this.state.modal;

    const endpoint = await this.getEndpoint();

    if (!endpoint) {
      throw new Error('No connection to the cluster.');
    }

    const value = buildCredentialValue(configurationTemplate, values);
    const metadata = buildCredentialMetadata({ mode, event, configurationTemplate, displayName });

    if (mode === 'create') {
      await this.createCredential({ endpoint, event, name, value, metadata });
    } else {
      await this.updateCredential({ endpoint, name, value, metadata });
    }

    this.closeModal();
  };

  /**
   * Create a new credential on the cluster, optimistically register it, and
   * notify the chooser so it can bind the new selection.
   *
   * @param {Object} options
   * @param {Object} options.endpoint
   * @param {ChooserEvent} options.event
   * @param {string} options.name
   * @param {Object} options.value
   * @param {Object} options.metadata
   */
  async createCredential({ endpoint, event, name, value, metadata }) {
    const variable = { name, value, kind: CREDENTIAL_VARIABLE_KIND, metadata };

    const result = await this.props.zeebeApi.createClusterVariable({ endpoint }, variable);

    if (!result.success) {
      throw new Error(result.reason || 'Could not create the credential.');
    }

    const instance = { name, metadata };

    this.registerSelectableInstance(instance);

    this.getService('eventBus').fire('configuration.created', {
      element: event.element,
      property: event.property,
      instance
    });
  }

  /**
   * Update an existing credential on the cluster and optimistically refresh its
   * registry entry.
   *
   * @param {Object} options
   * @param {Object} options.endpoint
   * @param {string} options.name
   * @param {Object} options.value
   * @param {Object} options.metadata
   */
  async updateCredential({ endpoint, name, value, metadata }) {
    const result = await this.props.zeebeApi.updateClusterVariable({ endpoint }, name, { value, metadata });

    if (!result.success) {
      throw new Error(result.reason || 'Could not update the credential.');
    }

    this.refreshSavedInstance({ name, metadata });
  }

  /**
   * Optimistically add a freshly created credential to the selectable instances.
   * The cluster-variable search is eventually consistent and may not return it
   * yet, which would otherwise leave the selection showing as "not found".
   *
   * @param {ConfigurationInstance} instance
   */
  registerSelectableInstance(instance) {
    const configurationInstances = this.getService('configurationInstances', false);

    if (!configurationInstances) {
      return;
    }

    configurationInstances.setState({
      selectableInstances: upsertInstance(configurationInstances.getSelectableInstances(), instance)
    });
  }

  /**
   * Optimistically reflect a saved credential in the registry. The search is
   * eventually consistent and would otherwise keep reporting the old version,
   * leaving an upgrade warning until the next reload.
   *
   * @param {ConfigurationInstance} instance
   */
  refreshSavedInstance(instance) {
    const configurationInstances = this.getService('configurationInstances', false);

    if (!configurationInstances) {
      return;
    }

    const referencedInstances = getReferencedCredentialNames(this.getService('elementRegistry'))
      .map(name => name === instance.name ? instance : configurationInstances.getReferencedInstanceByName(name))
      .filter(Boolean);

    configurationInstances.setState({
      selectableInstances: upsertInstance(configurationInstances.getSelectableInstances(), instance),
      referencedInstances
    });
  }

  /** Render the credential modal while it is open. */
  render() {
    const { modal } = this.state;

    if (!modal) {
      return null;
    }

    return (
      <CredentialsModal
        mode={ modal.mode }
        configurationTemplate={ modal.configurationTemplate }
        initialValues={ modal.initialValues }
        displayName={ modal.displayName }
        credentialName={ modal.credentialName }
        onSubmit={ this.handleSubmit }
        onClose={ this.closeModal }
      />
    );
  }
}


// helpers //////////

/**
 * Determine why the credential chooser is unavailable before querying the
 * cluster: no connection, or a connection check that already failed.
 *
 * @param {Object|null} endpoint
 * @param {Object} [connectionStatus]
 *
 * @returns {Object|null} a `configurationInstances` state, or null when available
 */
function getUnavailableState(endpoint, connectionStatus) {
  if (!endpoint) {
    return {
      available: false,
      loading: false,
      unavailableMessage: CONFIGURATION_UNAVAILABLE_MESSAGES.noConnection
    };
  }

  if (connectionStatus && connectionStatus.success === false) {
    const unsupported = connectionStatus.reason === CONNECTION_CHECK_ERROR_REASONS.UNSUPPORTED_ENGINE;

    return {
      available: false,
      loading: false,
      unavailableMessage: unsupported
        ? CONFIGURATION_UNAVAILABLE_MESSAGES.unsupported
        : CONFIGURATION_UNAVAILABLE_MESSAGES.offline
    };
  }

  return null;
}

/**
 * Map cluster-variable search results to chooser instances.
 *
 * @param {Array<Object>} [items]
 *
 * @returns {ConfigurationInstance[]}
 */
function toSelectableInstances(items) {
  return (items || []).map(({ name, metadata }) => ({ name, metadata }));
}

/**
 * Build the credential's stored value from the visible form fields.
 *
 * @param {ConfigurationTemplate|null} configurationTemplate
 * @param {Object} values - form field values
 *
 * @returns {Object}
 */
function buildCredentialValue(configurationTemplate, values) {
  const properties = getTemplateProperties(configurationTemplate);

  return buildConfig(getVisibleProperties(properties, values), values);
}

/**
 * Build the credential's metadata, stamping the appropriate template version.
 *
 * @param {Object} options
 * @param {string} options.mode
 * @param {ChooserEvent} options.event
 * @param {ConfigurationTemplate|null} options.configurationTemplate
 * @param {string} options.displayName
 *
 * @returns {Object}
 */
function buildCredentialMetadata({ mode, event, configurationTemplate, displayName }) {
  return {
    kind: 'CREDENTIAL',
    displayName,
    configurationTemplate: (configurationTemplate && configurationTemplate.id)
      || (event.instance && event.instance.metadata && event.instance.metadata.configurationTemplate),
    configurationTemplateVersion: getCredentialVersion(mode, configurationTemplate, event)
  };
}

/**
 * Determine the configuration template version to stamp on a credential:
 * create / upgrade never go below the template's version, a plain edit keeps
 * the stored one.
 *
 * @param {string} mode
 * @param {ConfigurationTemplate|null} configurationTemplate
 * @param {ChooserEvent} event
 *
 * @returns {number}
 */
function getCredentialVersion(mode, configurationTemplate, event) {
  const templateVersion = (configurationTemplate && configurationTemplate.version) || 1;

  if (mode === 'create') {
    return Math.max(templateVersion, event.configurationTemplateVersion || 1);
  }

  const currentVersion = (event.instance && event.instance.metadata
    && event.instance.metadata.configurationTemplateVersion) || 1;

  return mode === 'upgrade' ? Math.max(templateVersion, currentVersion) : currentVersion;
}

/**
 * The template's property schema, or an empty list when no template is resolved.
 *
 * @param {ConfigurationTemplate|null} configurationTemplate
 *
 * @returns {Array<Object>}
 */
function getTemplateProperties(configurationTemplate) {
  return (configurationTemplate && configurationTemplate.properties) || [];
}

/**
 * The existing credential's display name, or empty for a new credential.
 *
 * @param {string} mode
 * @param {ConfigurationInstance} [instance]
 *
 * @returns {string}
 */
function getCredentialDisplayName(mode, instance) {
  if (mode === 'create' || !instance) {
    return '';
  }

  return (instance.metadata && instance.metadata.displayName) || '';
}

/**
 * The existing credential's name, or null for a new credential.
 *
 * @param {string} mode
 * @param {ConfigurationInstance} [instance]
 *
 * @returns {string|null}
 */
function getCredentialName(mode, instance) {
  return mode !== 'create' && instance ? instance.name : null;
}

/**
 * Collect the cluster-variable names the diagram references through Configuration
 * bindings (`zeebe:input` sources and `zeebe:property` values).
 *
 * @param {Object} elementRegistry
 *
 * @returns {string[]}
 */
function getReferencedCredentialNames(elementRegistry) {
  const names = new Set();

  elementRegistry.getAll().forEach(element => collectElementReferences(names, element));

  return [ ...names ];
}

/**
 * Add the credential references declared on a single element's extension
 * elements to the given set.
 *
 * @param {Set<string>} names
 * @param {Object} element
 */
function collectElementReferences(names, element) {
  const businessObject = getBusinessObject(element);

  const extensionElements = businessObject && businessObject.get && businessObject.get('extensionElements');

  if (!extensionElements) {
    return;
  }

  (extensionElements.get('values') || []).forEach(extension => {
    if (is(extension, 'zeebe:IoMapping')) {
      (extension.get('inputParameters') || []).forEach(input => addCredentialReference(names, input.get('source')));
    }

    if (is(extension, 'zeebe:Properties')) {
      (extension.get('properties') || []).forEach(property => addCredentialReference(names, property.get('value')));
    }
  });
}

/**
 * Add the name from a `=camunda.vars.env.<name>` reference to the set, ignoring
 * non-reference values.
 *
 * @param {Set<string>} names
 * @param {*} value
 */
function addCredentialReference(names, value) {
  if (typeof value === 'string' && value.startsWith(CREDENTIAL_REFERENCE_PREFIX)) {
    names.add(value.slice(CREDENTIAL_REFERENCE_PREFIX.length));
  }
}

/**
 * Replace the instance with the same name, appending it when it is new.
 *
 * @param {ConfigurationInstance[]} instances
 * @param {ConfigurationInstance} instance
 *
 * @returns {ConfigurationInstance[]}
 */
function upsertInstance(instances, instance) {
  return [
    ...instances.filter(existing => existing.name !== instance.name),
    instance
  ];
}

/**
 * Derive create/update permissions from an authorizations search result.
 *
 * @param {Object} authorizationsResult
 *
 * @returns {{ create: boolean, update: boolean }}
 */
function getConfigurationPermissions(authorizationsResult) {
  if (!authorizationsResult || !authorizationsResult.success) {
    return { create: false, update: false };
  }

  const permissions = (authorizationsResult.response.items || [])
    .flatMap(item => item.permissionTypes || []);

  return {
    create: permissions.includes('CREATE'),
    update: permissions.includes('UPDATE')
  };
}

/**
 * Map a failed cluster-variable search into a chooser state: a reachable cluster
 * that rejects the request (404 endpoint missing, or 400 metadata filter
 * unsupported pre-8.10) is treated as an unsupported version; a missing status
 * means the cluster could not be reached (offline); anything else is a generic
 * error.
 *
 * @param {Object} variablesResult
 *
 * @returns {Object} a `configurationInstances` state
 */
function getConfigurationUnavailableState(variablesResult) {
  const { status } = variablesResult;

  if (status === 404 || status === 400) {
    return {
      available: false,
      loading: false,
      unavailableMessage: CONFIGURATION_UNAVAILABLE_MESSAGES.unsupported
    };
  }

  if (!status) {
    return {
      available: false,
      loading: false,
      unavailableMessage: CONFIGURATION_UNAVAILABLE_MESSAGES.offline
    };
  }

  return { loading: false, error: true };
}
