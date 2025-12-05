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

export default function Select(props) {

  const {
    label,
    field,
    fieldError,
    form,
    description,
    documentationUrl,
    placeholder,
    ...restProps
  } = props;

  const {
    name: fieldName
  } = field;

  const meta = form?.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  return (
    <React.Fragment>
      <div className="form-group">
        <div className="custom-control custom-select">
          <label className="custom-control-label" htmlFor={ fieldName }>
            { label }
            <DocumentationIcon url={ documentationUrl } />
          </label>
          <select
            { ...field }
            disabled={ form?.isSubmitting }
            className={ classNames('form-control', {
              'is-invalid': !!error
            }) }
            id={ fieldName }
            { ...restProps }
          >
            { placeholder && <>
              <option hidden>{ placeholder }</option>
              <option disabled>{ placeholder }</option>
            </>}
            {props.options.map(({ value, label }) => <option key={ value } value={ value }>{label}</option>)}
          </select>
          <FormFeedback
            error={ error }
          />
          {description && <div className="custom-control-description">{ description }</div>}
        </div>
      </div>
    </React.Fragment>
  );
}
