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
    multiline,
    description,
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
      if (description) {
        return <React.Fragment>
          {getTextarea()}
          <p className="form-control">{description}</p>
        </React.Fragment>;
      } else {
        return getTextarea();
      }
    } else {
      return <input
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
      />;
    }
  }

  return (
    <React.Fragment>
      <div className="form-group">
        <label htmlFor={ fieldName }>{ label }</label>
        {textElement()}
        <FormFeedback
          error={ error }
        />
      </div>
    </React.Fragment>
  );
}
