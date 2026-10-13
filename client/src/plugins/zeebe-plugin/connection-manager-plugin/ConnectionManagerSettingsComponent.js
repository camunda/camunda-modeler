/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { getIn, useFormikContext } from 'formik';

import { Loading } from '@carbon/react';

import { Notice, OptionsMenu } from '../../../shared/ui';

import { SettingsField, validateProperties } from '../../settings/SettingsForm';
import { SettingsList, SettingsListDialog, SettingsListItem } from '../../settings/SettingsList';

import { generateNewElement, properties } from './ConnectionManagerSettingsProperties';

import * as css from './ConnectionManagerSettingsComponent.css';

import { TARGET_TYPES } from '../../../remote/ZeebeAPI';

import { CONNECTION_CHECK_ERROR_REASONS, getConnectionCheckFieldErrors } from '../deployment-plugin/ConnectionCheckErrors';
import { isC8RunConnection } from '../shared/util';
import { C8RUN_DOCUMENTATION_URL, C8RUN_DOWNLOAD_URL, C8RUN_TROUBLESHOOTING_URL } from './constants';

const DRAFT = 'connection';

const UNNAMED_CONNECTION = 'Unnamed connection';


/**
 * Lists Camunda 8 connections, which can be added, edited, and removed
 * through a dialog that checks the edited connection.
 *
 * @param {Object} props
 * @param {string} props.name - Field name for the connection array
 * @param {string} [props.targetElement] - Element to open, e.g. `<name>[1].name` opens the second connection
 * @param {Object} props.connectionChecker - Connection checker instance ref
 */
export function ConnectionManagerSettingsComponent({ name: fieldName, targetElement, connectionChecker }) {

  const { values, setFieldValue } = useFormikContext();

  // `null` if closed, `-1` if adding, the index of the edited connection otherwise
  const [ editing, setEditing ] = useState(null);

  const addButton = useRef(null);
  const handledTargetElement = useRef(null);
  const lastEdited = useRef(null);

  const value = getIn(values, fieldName);
  const connections = useMemo(() => Array.isArray(value) ? value : [], [ value ]);

  const getId = (index) => `${ fieldName }[${ index }]`;

  // open the targeted connection, once it is loaded
  useEffect(() => {
    if (!targetElement || targetElement === handledTargetElement.current) {
      return;
    }

    const index = getTargetIndex(fieldName, targetElement);

    if (index !== -1 && connections[index]) {
      handledTargetElement.current = targetElement;
      setEditing(index);
    }
  }, [ fieldName, targetElement, connections ]);

  // keep the focus on the edited connection if the dialog has no element to return it to
  useEffect(() => {
    if (editing !== null) {
      lastEdited.current = editing;
      return;
    }

    const index = lastEdited.current;

    lastEdited.current = null;

    if (index === null || isFocused()) {
      return;
    }

    const menuButton = document.getElementById(getId(index))?.querySelector('button');

    (menuButton || addButton.current)?.focus();
  }, [ editing ]);

  const update = (connections) => setFieldValue(fieldName, connections);

  const remove = (index) => {
    update(connections.filter((_, i) => i !== index));
    addButton.current?.focus();
  };

  const save = (connection) => {
    if (editing === -1) {
      update([ ...connections, connection ]);
    } else {
      update(connections.map((existing, index) => index === editing ? { ...existing, ...connection, id: existing.id } : existing));
    }

    setEditing(null);
  };

  return <div className={ css.ConnectionManagerSettings } data-testid="connection-manager-settings" id={ fieldName }>
    <p className="connections__description">
      Deploy and run your processes on Camunda 8, including <a href={ C8RUN_DOCUMENTATION_URL }>Camunda 8 Run</a>.
    </p>
    { connections.length ? <SettingsList>
      { connections.map((connection, index) => {
        const label = connection.name || UNNAMED_CONNECTION;

        return <SettingsListItem
          key={ connection.id || index }
          id={ getId(index) }
          name={ <span id={ `${ getId(index) }.name` }>{ label }</span> }
          description={ getDescription(connection) }
          actions={ <OptionsMenu
            label={ `Options for ${ label }` }
            items={ [
              { label: 'Edit', onSelect: () => setEditing(index) },
              { label: 'Remove', onSelect: () => remove(index), danger: true }
            ] }
          /> }
        />;
      }) }
    </SettingsList> : <p className="connections__empty">
      No connections configured. Add a connection to deploy and run processes.
    </p> }
    <button
      ref={ addButton }
      type="button"
      className="btn btn-secondary"
      onClick={ () => setEditing(-1) }
    >Add connection</button>
    { editing !== null && <ConnectionDialog
      connection={ editing === -1 ? generateNewElement(connections.length) : connections[editing] }
      adding={ editing === -1 }
      connectionChecker={ connectionChecker }
      onSave={ save }
      onClose={ () => setEditing(null) }
    /> }
  </div>;
}

function ConnectionDialog({ connection, adding, connectionChecker, onSave, onClose }) {

  // a new connection is generated on every render
  const [ initialValues ] = useState(() => ({ [DRAFT]: connection }));

  const validate = (values) => {
    const errors = validateProperties(values[DRAFT], properties);

    return Object.keys(errors).length ? { [DRAFT]: errors } : {};
  };

  return <SettingsListDialog
    className={ css.ConnectionDialog }
    title={ getDialogTitle(connection, adding) }
    adding={ adding }
    initialValues={ initialValues }
    validate={ validate }
    onSubmit={ values => onSave(values[DRAFT]) }
    onClose={ onClose }
  >
    <ConnectionCheck connectionChecker={ connectionChecker } />
    <ConnectionNameField select={ adding } />
    {
      properties.map(property => <SettingsField
        key={ property.key }
        name={ `${ DRAFT }.${ property.key }` }
        { ...property }
      />)
    }
  </SettingsListDialog>;
}

function ConnectionNameField({ select }) {
  const name = `${ DRAFT }.name`;

  useEffect(() => {
    if (select) {
      document.getElementById(name)?.select();
    }
  }, []);

  return <SettingsField name={ name } type="text" label="Name" hint="My connection" />;
}

/**
 * Checks the edited connection, as long as it is valid.
 */
function ConnectionCheck({ connectionChecker }) {
  const { values } = useFormikContext();

  const connection = values[DRAFT];

  const [ result, setResult ] = useState(null);

  useEffect(() => {
    const checker = connectionChecker.current;

    checker.on('connectionCheck', setResult);

    return () => {
      checker.off('connectionCheck', setResult);
      checker.stopChecking();
    };
  }, [ connectionChecker ]);

  useEffect(() => {
    const checker = connectionChecker.current;

    setResult(null);

    if (Object.keys(validateProperties(connection, properties)).length) {
      checker.stopChecking();
      setResult({ success: false, reason: CONNECTION_CHECK_ERROR_REASONS.INVALID_CONFIGURATION });
      return;
    }

    checker.updateConfig({ endpoint: connection });
  }, [ connectionChecker, connection ]);

  return <Notice type={ getNoticeType(result) } icon={ result ? null : <Loading small withOverlay={ false } /> }>
    { getStatusText(result, connection) }
  </Notice>;
}


// helpers //////////

function getDialogTitle(connection, adding) {
  if (adding) {
    return 'Add Camunda 8 connection';
  }

  return connection.name ? `Edit ${ connection.name }` : 'Edit connection';
}

function getNoticeType(result) {
  if (!result) {
    return 'info';
  }

  return result.success ? 'success' : 'error';
}

function getStatusText(result, connection) {
  if (!result) {
    return 'Connecting to the Camunda 8 instance…';
  }

  if (result.success) {
    return 'Connected';
  }

  if (isC8RunConnection(connection)) {
    return <>
      Cannot connect to your local Camunda 8 instance. <a data-testid="c8run-download-link" href={ C8RUN_DOWNLOAD_URL }>Download</a> or start Camunda 8 Run to connect. See troubleshooting information about C8 Run <a data-testid="c8run-troubleshoot-link" href={ C8RUN_TROUBLESHOOTING_URL }>here</a>.
    </>;
  }

  return getConnectionCheckFieldErrors(result)?._mainError || 'Cannot connect to the Camunda 8 instance.';
}

/**
 * @param {Object} connection
 *
 * @return {string}
 */
function getDescription(connection) {
  if (connection.targetType === TARGET_TYPES.CAMUNDA_CLOUD) {
    return connection.camundaCloudClusterUrl || 'Camunda 8 SaaS';
  }

  if (connection.targetType === TARGET_TYPES.SELF_HOSTED) {
    return connection.contactPoint || 'Camunda 8 Self-Managed';
  }

  return '';
}

/**
 * @param {string} fieldName
 * @param {string} targetElement e.g. `<fieldName>[1].name`
 *
 * @return {number} index of the targeted connection, `-1` if none is targeted
 */
function getTargetIndex(fieldName, targetElement) {
  if (!targetElement.startsWith(`${ fieldName }[`)) {
    return -1;
  }

  const match = targetElement.slice(fieldName.length).match(/^\[(\d+)\]/);

  return match ? parseInt(match[1], 10) : -1;
}

function isFocused() {
  const { activeElement } = document;

  return !!activeElement && activeElement !== document.body && activeElement.isConnected;
}
