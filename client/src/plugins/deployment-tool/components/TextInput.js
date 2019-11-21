/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import classNames from 'classnames';

import FormFeedback from './FormFeedback';

import {
  fieldError as defaultFieldError
} from './Util';


export default function TextInput(props) {

  const {
    hint,
    label,
    field,
    form,
    fieldError,
    children,
    ...restProps
  } = props;

  const {
    name: fieldName,
    value: fieldValue
  } = field;

  const meta = form.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta);

  const invalid = error;
  const valid = !error && meta.touched;

  return (
    <React.Fragment>
      <div>
        <label htmlFor={ fieldName }>{ label }</label>
      </div>

      <div>
        <input
          { ...field }
          value={ fieldValue || '' }
          disabled={ form.isSubmitting }
          className={ classNames({
            invalid,
            valid
          }) }
          id={ fieldName }
          { ...restProps }
        />

        <FormFeedback
          hint={ hint }
          error={ error }
        />
      </div>
    </React.Fragment>
  );
}
