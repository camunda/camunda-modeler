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


export default function TextInput(props) {

  const {
    hint,
    label,
    field,
    form,
    fieldError,
    children,
    multiline,
    description,
    documentationUrl,
    ...restProps
  } = props;

  const {
    name: fieldName,
    value: fieldValue
  } = field;

  const meta = form.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  function textElement() {
    function getTextarea() {
      return <textarea
        { ...field }
        value={ fieldValue || '' }
        disabled={ form.isSubmitting }
        className={ classNames('form-control', {
          'is-invalid': !!error
        }) }
        id={ fieldName }
        placeholder={ hint }
        { ...restProps }
      />;
    }

    if (multiline) {
      return getTextarea();
    } else {
      return <React.Fragment>
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
      </React.Fragment>;
    }
  }

  return (
    <React.Fragment>
      <div className="form-group">
        <div className={
          classNames('custom-control', 'custom-text-input')
        }>
          <label htmlFor={ fieldName }>
            { label }
            <DocumentationIcon url={ documentationUrl } />
          </label>
          { textElement() }
          <FormFeedback
            error={ error }
          />
          { description &&
          <p className="custom-control-description">{ description }</p>
          }
        </div>
      </div>
    </React.Fragment>
  );
}
