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

export default function CheckBox(props) {

  const {
    hint,
    label,
    field,
    form,
    fieldError,
    ...restProps
  } = props;

  const {
    name: fieldName
  } = field;

  const meta = form.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta);

  return (
    <React.Fragment>
      <div />
      <div>
        <input
          { ...field }
          disabled={ form.isSubmitting }
          className={ classNames({
            invalid: !error
          }) }
          id={ fieldName }
          { ...restProps }
        />

        <label htmlFor={ fieldName }>{ label }</label>

        <FormFeedback
          hint={ hint }
          error={ error }
        />

      </div>
    </React.Fragment>
  );
}
