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

import debug from 'debug';

import { getBusinessObject, is } from 'bpmn-js/lib/util/ModelUtil';

import {
  CredentialModal,
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

import { debounce } from '../../../../util';

const log = debug('CredentialManager');

/**
 * @typedef {Object} ConfigurationInstance
 * @property {string} name - cluster-variable name
 * @property {Object} metadata - credential metadata (kind, configurationTemplate, ...)
 * @property {string} [icon] - configuration-template icon contents
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

const SEARCH_PAGE_SIZE = 100;

const CREDENTIAL_REFERENCE_PREFIX = '=camunda.vars.env.';

const CREDENTIAL_VARIABLE_KIND = 'SECRET_REFERENCE';

const CREDENTIAL_CREATE_FORBIDDEN_MESSAGE =
  'You do not have permission to create credentials on this cluster. Contact your cluster administrator.';

const CREDENTIAL_UPDATE_FORBIDDEN_MESSAGE =
  'You do not have permission to update credentials on this cluster. Contact your cluster administrator.';

/**
 * Hosts the element-template credential chooser for a cloud BPMN tab: feeds the
 * `configurationInstances` registry from the connected cluster and drives the
 * create / edit / upgrade modal in response to the chooser's eventBus events.
 */
export default class CredentialManager extends PureComponent {

  static contextType = EventsContext;

  constructor(props) {
    super(props);

    this.state = { modal: null };

    this.updateConfigurationInstancesDebounced = debounce(() => this.updateConfigurationInstances());
    this._configurationUpdatePromise = null;
    this._configurationUpdatePending = false;
    this._pendingConnectionStatus = undefined;
  }

  componentDidMount() {
    const eventBus = this.getService('eventBus');

    eventBus.on('configuration.create', this.handleConfigurationCreate);
    eventBus.on('configuration.edit', this.handleConfigurationEdit);
    eventBus.on('configuration.upgrade', this.handleConfigurationUpgrade);
    eventBus.on('import.done', this.updateConfigurationInstancesDebounced);
    eventBus.on('elementTemplates.changed', this.updateConfigurationInstancesDebounced);

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
    eventBus.off('import.done', this.updateConfigurationInstancesDebounced);
    eventBus.off('elementTemplates.changed', this.updateConfigurationInstancesDebounced);

    this.updateConfigurationInstancesDebounced.cancel();

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
   * Push state into the credential chooser's `configurationInstances` registry,
   * logging what is set for diagnostics (e.g. the resolved create/update
   * permissions and why the chooser is available or not).
   *
   * @param {Object} configurationInstances
   * @param {Object} state
   */
  setConfigurationInstancesState(configurationInstances, state) {
    log('setting configuration instances state', state);

    configurationInstances.setState(state);
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
    this._pendingConnectionStatus = connectionStatus;

    if (this._configurationUpdatePromise) {
      this._configurationUpdatePending = true;

      return this._configurationUpdatePromise;
    }

    this._configurationUpdatePromise = this.runConfigurationUpdates();

    try {
      await this._configurationUpdatePromise;
    } finally {
      this._configurationUpdatePromise = null;
    }
  }

  async runConfigurationUpdates() {
    do {
      this._configurationUpdatePending = false;

      await this.updateConfigurationInstancesOnce(this._pendingConnectionStatus);
    } while (this._configurationUpdatePending);
  }

  async updateConfigurationInstancesOnce(connectionStatus) {
    const configurationInstances = this.getService('configurationInstances', false);

    if (!configurationInstances) {
      return;
    }

    const endpoint = await this.getEndpoint();

    const unavailableState = getUnavailableState(endpoint, connectionStatus);

    if (unavailableState) {
      this.setConfigurationInstancesState(configurationInstances, unavailableState);

      return;
    }

    this.setConfigurationInstancesState(configurationInstances, { available: true, loading: true, error: false });

    try {
      await this.loadConfigurationInstances(configurationInstances, endpoint);
    } catch (error) {
      this.setConfigurationInstancesState(configurationInstances, { loading: false, error: true });
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
    const elementRegistry = this.getService('elementRegistry', false);
    const elementTemplates = this.getService('elementTemplates', false);

    const filters = getConfigurationSearchFilters(
      elementRegistry,
      elementTemplates
    );

    if (!filters.length) {
      this.setConfigurationInstancesState(configurationInstances, {
        available: false,
        loading: false,
        error: false,
        permissions: { create: false, update: false },
        selectableInstances: [],
        referencedInstances: []
      });

      return;
    }

    const [ authorizationsResult, variablesResults ] = await Promise.all([
      this.getAllAuthorizations(endpoint),
      Promise.all(filters.map(filter => this.getAllClusterVariables(endpoint, filter)))
    ]);

    const failedVariablesResult = variablesResults.find(result => !result.success);

    if (failedVariablesResult) {
      this.setConfigurationInstancesState(
        configurationInstances,
        getConfigurationUnavailableState(failedVariablesResult)
      );

      return;
    }

    const selectableInstances = toSelectableInstances(uniqueByName(
      variablesResults.flatMap(result => result.response.items)
    ))
      .map(instance => this.withInstanceIcon(instance));

    const referencedInstances = await this.getReferencedInstances(endpoint, selectableInstances);

    this.setConfigurationInstancesState(configurationInstances, {
      available: true,
      loading: false,
      error: false,
      permissions: getConfigurationPermissions(authorizationsResult),
      selectableInstances,
      referencedInstances
    });
  }

  getAllAuthorizations(endpoint) {
    return getAllSearchResults(page => {
      return this.props.zeebeApi.getAuthorizations({ endpoint }, 'CLUSTER_VARIABLE', page);
    });
  }

  getAllClusterVariables(endpoint, filter) {
    return getAllSearchResults(page => {
      return this.props.zeebeApi.searchClusterVariables({ endpoint }, filter, page);
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
        referencedInstances.push(this.withInstanceIcon({
          name: namesToFetch[index],
          metadata: result.response.metadata
        }));
      }
    });

    return referencedInstances;
  }

  /** @param {Object} [connectionStatus] */
  handleConnectionStatusChanged = (connectionStatus = {}) => {
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

    const initialValues = getInitialFieldValues(properties);

    const { instance } = event;

    const configurationInstances = this.getService('configurationInstances', false);
    const existingCredentials = configurationInstances
      ? configurationInstances.getSelectableInstances()
      : [];

    this.setState({
      modal: {
        mode,
        event,
        configurationTemplate,
        existingCredentials,
        initialValues,
        loading: mode !== 'create' && !!instance,
        secretReferences: null,
        displayName: getCredentialDisplayName(mode, instance, event.element),
        credentialName: getCredentialName(mode, instance)
      }
    });

    Promise.all([
      this.getInitialValues(mode, event, properties, initialValues),
      this.getSecretReferences(properties)
    ])
      .then(([ loadedInitialValues, secretReferences ]) => this.updateModal(event, {
        initialValues: loadedInitialValues,
        loading: false,
        secretReferences
      }))
      .catch(error => this.props.onError({ error }));
  }

  updateModal(event, updates) {
    this.setState((state) => {
      if (!state.modal || state.modal.event !== event) {
        return null;
      }

      return {
        modal: {
          ...state.modal,
          ...updates
        }
      };
    });
  }

  /**
   * List the secret references (`camunda.secrets.<name>`) on the connected
   * cluster so the modal can flag references that do not exist yet. Returns null
   * when the template has no secret fields, there is no connection, or the
   * cluster does not expose the (version-gated) secrets endpoint — in which case
   * no existence check is performed.
   *
   * @param {Array<Object>} properties
   *
   * @returns {Promise<string[]|null>}
   */
  async getSecretReferences(properties) {
    if (!properties.some(property => property.secret === true)) {
      return null;
    }

    const endpoint = await this.getEndpoint();

    if (!endpoint) {
      return null;
    }

    const result = await this.props.zeebeApi.listSecrets({ endpoint });

    if (!result.success || !result.response) {
      return null;
    }

    return result.response.references;
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
    const metadata = buildCredentialMetadata({ event, configurationTemplate, displayName });

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
      throw new Error(result.reason === 'FORBIDDEN'
        ? CREDENTIAL_CREATE_FORBIDDEN_MESSAGE
        : result.reason || 'Could not create the credential.');
    }

    const instance = this.withInstanceIcon({ name, metadata });

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
      throw new Error(result.reason === 'FORBIDDEN'
        ? CREDENTIAL_UPDATE_FORBIDDEN_MESSAGE
        : result.reason || 'Could not update the credential.');
    }

    this.refreshSavedInstance(this.withInstanceIcon({ name, metadata }));
  }

  /**
   * Attach the credential's configuration-template icon so the chooser can show
   * it per instance.
   *
   * @param {ConfigurationInstance} instance
   *
   * @returns {ConfigurationInstance}
   */
  withInstanceIcon(instance) {
    const configurationTemplates = this.getService('configurationTemplates', false);

    const { metadata } = instance;

    const template = configurationTemplates && metadata
      && configurationTemplates.get(metadata.configurationTemplate, metadata.configurationTemplateVersion);

    return { ...instance, icon: template && template.icon && template.icon.contents };
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

    this.setConfigurationInstancesState(configurationInstances, {
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

    this.setConfigurationInstancesState(configurationInstances, {
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
      <CredentialModal
        mode={ modal.mode }
        configurationTemplate={ modal.configurationTemplate }
        existingCredentials={ modal.existingCredentials }
        initialValues={ modal.initialValues }
        loading={ modal.loading }
        secretReferences={ modal.secretReferences }
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
 * Fetch every page from a search endpoint using cursor pagination.
 *
 * @param {Function} search
 * @returns {Promise<Object>}
 */
async function getAllSearchResults(search) {
  const items = [];
  let after;
  let hasNextPage = true;

  while (hasNextPage) {
    const page = {
      limit: SEARCH_PAGE_SIZE,
      ...(after ? { after } : {})
    };
    const result = await search(page);

    if (!result.success) {
      return result;
    }

    const responseItems = result.response.items || [];
    const endCursor = result.response.page && result.response.page.endCursor;

    items.push(...responseItems);

    hasNextPage = responseItems.length > 0 && !!endCursor && endCursor !== after;
    after = endCursor;

    if (!hasNextPage) {
      return {
        ...result,
        response: {
          ...result.response,
          items
        }
      };
    }
  }
}

/**
 * Build one server-side credential filter per Configuration property used by
 * an applied element template.
 *
 * @param {Object|null} elementRegistry
 * @param {Object|null} elementTemplates
 * @returns {Object[]}
 */
function getConfigurationSearchFilters(elementRegistry, elementTemplates) {
  const configurationTemplates = new Set();

  if (!elementRegistry || !elementTemplates) {
    return [];
  }

  elementRegistry.getAll().forEach(element => {
    const elementTemplate = elementTemplates.get(element);

    (elementTemplate && elementTemplate.properties || []).forEach(property => {
      if (property.type === 'Configuration' && property.configurationTemplate) {
        configurationTemplates.add(property.configurationTemplate);
      }
    });
  });

  return [ ...configurationTemplates ].map(configurationTemplate => ({
    metadata: {
      kind: { '$eq': 'CREDENTIAL' },
      configurationTemplate: { '$eq': configurationTemplate }
    }
  }));
}

/**
 * De-duplicate configuration instances by cluster-variable name.
 *
 * @param {ConfigurationInstance[]} instances
 * @returns {ConfigurationInstance[]}
 */
function uniqueByName(instances) {
  return [ ...new Map(instances.map(instance => [ instance.name, instance ])).values() ];
}

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
 * @param {ChooserEvent} options.event
 * @param {ConfigurationTemplate|null} options.configurationTemplate
 * @param {string} options.displayName
 *
 * @returns {Object}
 */
function buildCredentialMetadata({ event, configurationTemplate, displayName }) {
  return {
    kind: 'CREDENTIAL',
    displayName,
    configurationTemplate: (configurationTemplate && configurationTemplate.id)
      || (event.instance && event.instance.metadata && event.instance.metadata.configurationTemplate),
    configurationTemplateVersion: getCredentialVersion(configurationTemplate, event)
  };
}

/**
 * The configuration template version to stamp on the credential: always the
 * rendered template's version, so any create, edit or upgrade auto-upgrades the
 * stored version to the template embedded in the element template. Falls back to
 * the floor, then the stored version, then 1 when no template resolves.
 *
 * @param {ConfigurationTemplate|null} configurationTemplate
 * @param {ChooserEvent} event
 *
 * @returns {number}
 */
function getCredentialVersion(configurationTemplate, event) {
  return (configurationTemplate && configurationTemplate.version)
    || event.configurationTemplateVersion
    || (event.instance && event.instance.metadata
      && event.instance.metadata.configurationTemplateVersion)
    || 1;
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
 * The credential's display name: a suggestion derived from the bound element on
 * create, or the existing credential's name on edit / upgrade.
 *
 * @param {string} mode
 * @param {ConfigurationInstance} [instance]
 * @param {Object} [element] - the element the chooser is on (create only)
 *
 * @returns {string}
 */
function getCredentialDisplayName(mode, instance, element) {
  if (mode === 'create') {
    return getSuggestedCredentialName(element);
  }

  return (instance && instance.metadata && instance.metadata.displayName) || '';
}

/**
 * Suggest a credential name from an element: its name in UPPER_SNAKE_CASE, or
 * its ID uppercased when it has no name.
 *
 * @param {Object} [element]
 *
 * @returns {string}
 */
function getSuggestedCredentialName(element) {
  if (!element) {
    return '';
  }

  const businessObject = getBusinessObject(element);

  const name = businessObject && businessObject.name;

  if (name && name.trim()) {
    return name.trim();
  }

  return element.id || '';
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

  if (authorizationsResult.response.authorizationsEnabled === false) {
    return { create: true, update: true };
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
