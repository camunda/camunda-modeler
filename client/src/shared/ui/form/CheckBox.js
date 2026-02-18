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
import DocumentationIcon from './DocumentationIcon';

import {
  fieldError as defaultFieldError
} from './Util';

export default function CheckBox(props) {

  const {
    hint,
    label,
    field,
    form,
    description,
    documentationUrl,
    fieldError,
    ...restProps
  } = props;

  const {
    name,
    value,
    ...restField
  } = field;

  const meta = form.getFieldMeta(name);
  const error = (fieldError || defaultFieldError)(meta, name);

  return (
    <React.Fragment>
      <div className="form-group">
        <div className={
          classNames('custom-control', 'custom-checkbox')
        }>
          <input
            type="checkbox"
            name={ name }
            checked={ !!value }
            disabled={ form.isSubmitting }
            className={ classNames('custom-control-input', {
              'is-invalid': !!error
            }) }
            id={ name }
            { ...restField }
            { ...restProps }
          />
          <label
            className={ classNames('custom-control-option', {
              'is-invalid': !!error
            }) }
            htmlFor={ name }
          >
            { label }
            <DocumentationIcon url={ documentationUrl } />
          </label>
          <FormFeedback
            error={ error }
          />
          <div className="custom-control-description">{ description }</div>
        </div>
      </div>
    </React.Fragment>
  );
}
