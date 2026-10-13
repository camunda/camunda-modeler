/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useMemo, useRef, useState } from 'react';

import { Field, getIn, useFormikContext } from 'formik';
import { Tag } from '@carbon/react';

import { OptionsMenu, TextInput, ToggleSwitch } from '../../shared/ui';
import DocumentationIcon from '../../shared/ui/form/DocumentationIcon';

import Flags from '../../util/Flags';
import { utmTag } from '../../util/utmTag';

import { SettingsList, SettingsListDialog, SettingsListItem } from './SettingsList';

import * as css from './ElementTemplatesSettings.css';

export const DISABLE_CONNECTOR_TEMPLATES = 'app.disableConnectorTemplates';

export const DISABLE_CONNECTOR_TEMPLATES_FLAG = 'disable-connector-templates';

const CONNECTOR_TEMPLATES_NAME = 'Camunda connectors';

const CONNECTOR_TEMPLATES_DOCUMENTATION_URL = utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/use-connectors/#automatic-connector-template-fetching');

const FLAGS_DOCUMENTATION_URL = utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/');


/** Header for the (Camunda 8 only) remote element template sources section. */
export function ElementTemplatesSettingsHeader() {
  return <span>Element template sources <Tag size="sm" type="blue">Camunda 8 only</Tag></span>;
}

/**
 * Lists element template sources: Camunda connectors, which can be turned off,
 * and custom HTTP(S) sources (`{ name, url, enabled }`), which can be added,
 * turned off, edited, and removed.
 */
export function TemplateSources({ name }) {
  const { values, setFieldValue } = useFormikContext();

  // `null` if closed, `-1` if adding, the index of the edited source otherwise
  const [ editing, setEditing ] = useState(null);
  const addButton = useRef(null);

  const value = getIn(values, name);
  const entries = useMemo(() => Array.isArray(value) ? value : [], [ value ]);
  const sources = useMemo(() => entries.map(toSource), [ entries ]);

  const connectorTemplatesFlag = useMemo(() => Flags.get(DISABLE_CONNECTOR_TEMPLATES_FLAG), []);
  const connectorTemplatesEnabled = getIn(values, DISABLE_CONNECTOR_TEMPLATES) !== true;

  const update = (entries) => setFieldValue(name, entries);

  const change = (index, changes) => {
    update(entries.map((entry, i) => i === index ? { ...entry, ...changes } : entry));
  };

  const remove = (index) => {
    update(entries.filter((_, i) => i !== index));
    addButton.current?.focus();
  };

  const save = (source) => {
    if (editing === -1) {
      update([ ...entries, { ...source, enabled: true } ]);
    } else {
      change(editing, source);
    }

    setEditing(null);
  };

  return <div className={ css.ElementTemplatesSettings }>
    <SettingsList>
      <SourceItem
        name={ <>{ CONNECTOR_TEMPLATES_NAME }<DocumentationIcon url={ CONNECTOR_TEMPLATES_DOCUMENTATION_URL } /></> }
        label={ CONNECTOR_TEMPLATES_NAME }
        description="Camunda Marketplace"
        enabled={ connectorTemplatesEnabled }
        disabled={ connectorTemplatesFlag !== undefined }
        onToggle={ enabled => setFieldValue(DISABLE_CONNECTOR_TEMPLATES, !enabled) }
      />
      { sources.map((source, index) => <SourceItem
        key={ index }
        name={ source.label }
        label={ source.label }
        description={ source.valid ? source.url : 'Invalid source, it is ignored.' }
        invalid={ !source.valid }
        enabled={ source.enabled }
        onToggle={ source.valid ? enabled => change(index, { enabled }) : null }
        options={ [
          { label: 'Edit', onSelect: () => setEditing(index) },
          { label: 'Remove', onSelect: () => remove(index), danger: true }
        ] }
      />) }
    </SettingsList>
    { connectorTemplatesFlag !== undefined && <div className="flag-warning">
      { CONNECTOR_TEMPLATES_NAME } are overridden by <code>{ DISABLE_CONNECTOR_TEMPLATES_FLAG }</code> flag.&nbsp;
      <a href={ FLAGS_DOCUMENTATION_URL }>Learn more.</a>
    </div> }
    <button
      ref={ addButton }
      type="button"
      className="btn btn-secondary"
      onClick={ () => setEditing(-1) }
    >Add source</button>
    { editing !== null && <SourceDialog
      source={ sources[editing] }
      sources={ sources.filter((_, index) => index !== editing) }
      onSave={ save }
      onClose={ () => setEditing(null) }
    /> }
  </div>;
}

function SourceItem(props) {
  const {
    name,
    label,
    description,
    enabled,
    disabled,
    invalid,
    onToggle,
    options
  } = props;

  return <SettingsListItem
    name={ name }
    description={ description }
    invalid={ invalid }
    actions={ <>
      { onToggle && <ToggleSwitch
        field={ {
          name: label,
          value: enabled,
          onChange: event => onToggle(event.target.checked)
        } }
        role="switch"
        aria-label={ label }
        disabled={ disabled }
      /> }
      { options && <OptionsMenu label={ `Options for ${ label }` } items={ options } /> }
    </> }
  />;
}

function SourceDialog({ source, sources, onSave, onClose }) {
  const validate = ({ templateSourceName: name, templateSourceUrl: url }) => {
    const errors = {};

    if (!name.trim()) {
      errors.templateSourceName = 'Enter a name.';
    } else if ([ CONNECTOR_TEMPLATES_NAME, ...sources.map(source => source.name) ].includes(name.trim())) {
      errors.templateSourceName = 'A source with this name already exists.';
    }

    const normalizedUrl = normalizeUrl(url);

    if (!url.trim()) {
      errors.templateSourceUrl = 'Enter a URL.';
    } else if (!normalizedUrl) {
      errors.templateSourceUrl = 'Enter an HTTP(S) URL without credentials.';
    } else if (sources.some(source => source.url === normalizedUrl)) {
      errors.templateSourceUrl = 'A source with this URL already exists.';
    }

    return errors;
  };

  const submit = ({ templateSourceName: name, templateSourceUrl: url }) => {
    onSave({ name: name.trim(), url: normalizeUrl(url) });
  };

  return <SettingsListDialog
    title={ source ? 'Edit element template source' : 'Add element template source' }
    adding={ !source }
    initialValues={ {
      templateSourceName: source?.name || '',
      templateSourceUrl: source?.url || ''
    } }
    validate={ validate }
    onSubmit={ submit }
    onClose={ onClose }
  >
    <Field name="templateSourceName">
      { ({ field, form }) => <TextInput
        field={ field }
        form={ form }
        label="Name"
        hint="My templates"
      /> }
    </Field>
    <Field name="templateSourceUrl">
      { ({ field, form }) => <TextInput
        field={ field }
        form={ form }
        label="Index URL"
        hint="https://example.com/element-templates/index.json"
        description="HTTP(S) URL of an element templates index, without credentials."
        spellCheck={ false }
      /> }
    </Field>
  </SettingsListDialog>;
}


// helpers //////////

/**
 * @param {unknown} entry persisted custom source
 * @param {number} index
 *
 * @return {{ name?: string, url?: string, label: string, enabled: boolean, valid: boolean }}
 */
function toSource(entry, index) {
  const { name, url, enabled } = isObject(entry) ? entry : {};
  const normalizedUrl = normalizeUrl(url);
  const trimmedName = typeof name === 'string' && name.trim() ? name.trim() : undefined;

  return {
    name: trimmedName,
    url: normalizedUrl || undefined,

    // never echo invalid URLs, they may contain credentials
    label: trimmedName || normalizedUrl || `Invalid source ${ index + 1 }`,
    enabled: enabled !== false,
    valid: !!normalizedUrl
  };
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (![ 'http:', 'https:' ].includes(url.protocol) || url.username || url.password) {
      return null;
    }

    url.hash = '';

    return url.href;
  } catch {
    return null;
  }
}
