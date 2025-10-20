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

export default function Radio(props) {

  const {
    hint,
    label,
    field,
    fieldError,
    form,
    children,
    values,
    className,
    documentationUrl,
    description,
    ...restProps
  } = props;

  const {
    name: fieldName
  } = field;

  const meta = form.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  const isChecked = (childValue) => meta.value === childValue;

  return (
    <React.Fragment>
      <div className={
        classNames('form-group', 'form-inline', className)
      }>
        <label htmlFor={ fieldName }>
          { label }
          <DocumentationIcon url={ documentationUrl } />
        </label>
        <div className="form-check-inline">
          {
            values.map((child) => {
              const id = `radio-element-${fieldName}-${toKebabCase(child.label)}`;
              return (
                <React.Fragment key={ child.label }>
                  <div className={
                    classNames('custom-control', 'custom-radio')
                  }>
                    <input
                      { ...field }
                      type="radio"
                      name={ fieldName }
                      value={ child.value }
                      checked={ isChecked(child.value) }
                      className="custom-control-input"
                      id={ id }
                      tabIndex={ 0 }
                      { ...restProps } />
                    <label
                      htmlFor={ id }
                      className="custom-control-label">
                      { child.label }
                    </label>
                  </div>
                </React.Fragment>
              );
            })
          }
        </div>
        <FormFeedback
          error={ error }
        />
        <div className="custom-control-description">{ description }</div>
      </div>
    </React.Fragment>
  );
}



// helper /////
/**
 * Converts text to kebab-case.
 *
 * @example
 * const label = "HTTP Basic";
 *
 * // http-basic
 * const id = toKebabCase(label);
 *
 * @param {string} name
 */
function toKebabCase(name) {
  return name.toLowerCase().replace(/\s/g, '-');
}
