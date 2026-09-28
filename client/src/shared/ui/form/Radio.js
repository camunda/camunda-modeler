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

import {
  Label,
  RadioGroup,
  RadioGroupItem
} from '@camunda/design-system';

import FormFeedback from './FormFeedback';
import DocumentationIcon from './DocumentationIcon';

import {
  fieldError as defaultFieldError
} from './Util';

import * as css from './Field.css';

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
    onChange = field.onChange,
    ...restProps
  } = props;

  const {
    name: fieldName,
    onBlur
  } = field;

  const meta = form.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  const labelId = `${ fieldName }-label`;
  const errorId = `${ fieldName }-error-msg`;

  // radio values must be strings, so use the option index
  const selectedIndex = values.findIndex(child => child.value === meta.value);

  // emulate a native radio change for Formik and custom handlers
  const handleValueChange = (index) => onChange({
    target: { name: fieldName, type: 'radio', value: values[ index ].value }
  });

  return (
    <div className={ classNames('form-group', css.Field, className) }>
      <Label id={ labelId }>
        { label }
        <DocumentationIcon url={ documentationUrl } />
      </Label>
      <RadioGroup
        className="field__options"
        name={ fieldName }
        value={ selectedIndex === -1 ? '' : String(selectedIndex) }
        onValueChange={ handleValueChange }
        aria-labelledby={ labelId }
        aria-invalid={ !!error }
        aria-errormessage={ error ? errorId : undefined }
        { ...restProps }
      >
        {
          values.map((child, index) => {
            const id = `radio-element-${fieldName}-${toKebabCase(child.label)}`;

            return (
              <div className="field__option" key={ child.label }>
                <RadioGroupItem
                  id={ id }
                  value={ String(index) }
                  onBlur={ () => onBlur && onBlur({ target: { name: fieldName } }) }
                />
                <Label htmlFor={ id }>
                  { child.label }
                </Label>
              </div>
            );
          })
        }
      </RadioGroup>
      <FormFeedback id={ errorId } error={ error } />
      { description && <div className="field__description">{ description }</div> }
    </div>
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
