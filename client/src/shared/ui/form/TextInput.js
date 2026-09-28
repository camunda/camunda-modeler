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
  Input,
  Label,
  Textarea
} from '@camunda/design-system';

import DocumentationIcon from './DocumentationIcon';
import FormFeedback from './FormFeedback';

import {
  fieldError as defaultFieldError
} from './Util';

import * as css from './Field.css';


/**
 * Text field for Formik, exposed to plugins via `global.components`; keep the
 * props stable.
 */
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

  const errorId = `${ fieldName }-error-msg`;
  const descriptionId = `${ fieldName }-description`;

  const Control = multiline ? Textarea : Input;

  // own messages, as the input re-mounts (and loses focus) when its `invalidText` toggles
  return (
    <div className={ classNames('form-group', css.Field) }>
      { (label || documentationUrl) && (
        <Label htmlFor={ fieldName }>
          { label }
          <DocumentationIcon url={ documentationUrl } />
        </Label>
      ) }
      <Control
        { ...field }
        type={ multiline ? undefined : 'text' }
        value={ fieldValue || '' }
        disabled={ form.isSubmitting }
        id={ fieldName }
        placeholder={ hint }
        aria-invalid={ !!error }
        aria-errormessage={ error ? errorId : undefined }
        aria-describedby={ description ? descriptionId : undefined }
        { ...restProps }
      />
      <FormFeedback id={ errorId } error={ error } />
      { description && <div id={ descriptionId } className="field__description">{ description }</div> }
    </div>
  );
}
