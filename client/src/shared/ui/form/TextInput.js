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

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  return (
    <React.Fragment>
      <div className="form-group">
        <label htmlFor={ fieldName }>{ label }</label>
        <input
          { ...field }
          type="text"
          value={ fieldValue || '' }
          disabled={ form.isSubmitting }
          className={ classNames('form-control', {
            'is-invalid': !!error
          }) }
          id={ fieldName }
          placeholder={ hint }
          { ...restProps }
        />
        <FormFeedback
          error={ error }
        />
      </div>
    </React.Fragment>
  );
}
