/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef } from 'react';

import { Field, FieldArray, getIn, useFormikContext } from 'formik';
import { Tag } from '@carbon/react';

import { TextInput, ToggleSwitch } from '../../shared/ui';
import Flags from '../../util/Flags';
import { utmTag } from '../../util/utmTag';

import * as css from './ElementTemplatesSettings.css';


/** Header for the Camunda 8 element-template settings section. */
export function ElementTemplatesSettingsHeader() {
  return <span>Element templates <Tag size="sm" type="blue">Camunda 8 only</Tag></span>;
}

/** Positive OOTB toggle backed by the existing negative setting and flag. */
export function OOTBTemplatesToggle({ name, label, flag, documentationUrl }) {
  const disabledByFlag = Flags.get(flag) !== undefined;

  return <div id={ name }>
    <Field name={ name }>
      { ({ field, form }) => <ToggleSwitch
        field={ {
          ...field,
          value: !field.value,
          onChange: event => form.setFieldValue(name, !event.target.checked)
        } }
        form={ form }
        label={ label }
        disabled={ disabledByFlag }
        description={ <span>Fetch connector templates from Camunda Marketplace. <a href={ documentationUrl }>Learn more.</a></span> }
      /> }
    </Field>
    { disabledByFlag && <div className="flag-warning">
      This option is overridden by <code>{ flag }</code> flag.&nbsp;
      <a href={ utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/flags/') }>Learn more.</a>
    </div> }
  </div>;
}

/** Ordered HTTP(S) index URLs; changes use the normal Settings restart lifecycle. */
export function CustomTemplateSources({ name }) {
  const { values, setFieldValue } = useFormikContext();
  const value = getIn(values, name);
  const sources = Array.isArray(value) ? value : [];
  const container = useRef(null);
  const focusAddedRow = useRef(false);

  useEffect(() => {
    if (focusAddedRow.current) {
      container.current.querySelectorAll('input')[sources.length - 1]?.focus();
      focusAddedRow.current = false;
    }
  }, [ sources.length ]);

  return <div className={ css.ElementTemplatesSettings } id={ name } ref={ container }>
    <p>Custom template sources</p>
    <p className="custom-control-description">
      Add HTTP(S) element-template index URLs without credentials. Later sources override matching template IDs and versions from earlier sources and OOTB. Restart to apply changes.
    </p>
    { value !== undefined && !Array.isArray(value) && <p role="alert">
      Invalid source list. Add a source to replace it.
    </p> }
    <FieldArray name={ name }>
      { ({ push, remove }) => <>
        { sources.map((source, index) => <div className="source-row" key={ index }>
          <Field
            name={ `${ name }[${ index }]` }
            validate={ current => validateSourceUrl(current, sources.slice(0, index)) }
          >
            { ({ field, form }) => <TextInput
              field={ { ...field, value: typeof field.value === 'string' ? field.value : '' } }
              form={ form }
              fieldError={ meta => meta.error }
              label={ `Source ${ index + 1 } URL` }
              hint="https://example.com/element-templates/index.json"
              spellCheck={ false }
            /> }
          </Field>
          <button
            type="button"
            className="btn btn-secondary remove-source"
            aria-label={ `Remove source ${ index + 1 }` }
            onClick={ () => remove(index) }
          >Remove</button>
        </div>) }
        <button type="button" className="btn btn-secondary" onClick={ () => {
          focusAddedRow.current = true;
          if (Array.isArray(value)) {
            push('');
          } else {
            setFieldValue(name, [ '' ]);
          }
        } }>Add source</button>
      </> }
    </FieldArray>
  </div>;
}


// helpers //////////

function validateSourceUrl(value, previous) {
  const url = normalizeUrl(value);

  if (!url) {
    return 'Enter an HTTP(S) URL without credentials.';
  }

  if (previous.some(source => normalizeUrl(source) === url)) {
    return 'This source URL is already configured.';
  }
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
