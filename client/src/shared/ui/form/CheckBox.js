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
  Checkbox,
  Label
} from '@camunda/design-system';

import FormFeedback from './FormFeedback';
import DocumentationIcon from './DocumentationIcon';

import {
  fieldError as defaultFieldError
} from './Util';

import * as css from './Field.css';

export default function CheckBox(props) {

  const {
    hint,
    label,
    field,
    form,
    description,
    documentationUrl,
    fieldError,
    type,
    onChange = field.onChange,
    ...restProps
  } = props;

  const {
    name,
    value,
    onBlur
  } = field;

  const meta = form.getFieldMeta(name);
  const error = (fieldError || defaultFieldError)(meta, name);

  const errorId = `${ name }-error-msg`;

  // emulate a native checkbox change for Formik and custom handlers
  const handleCheckedChange = (checked) => onChange({
    target: { name, type: 'checkbox', checked: checked === true }
  });

  return (
    <div className={ classNames('form-group', css.Field) }>
      <div className="field__option">
        <Checkbox
          id={ name }
          name={ name }
          checked={ !!value }
          disabled={ form.isSubmitting }
          aria-invalid={ !!error }
          aria-errormessage={ error ? errorId : undefined }
          onCheckedChange={ handleCheckedChange }
          onBlur={ onBlur }
          { ...restProps }
        />
        <Label htmlFor={ name }>
          { label }
          <DocumentationIcon url={ documentationUrl } />
        </Label>
      </div>
      <FormFeedback id={ errorId } error={ error } />
      { description && <div className="field__description">{ description }</div> }
    </div>
  );
}
