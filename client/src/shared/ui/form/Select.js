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

import {
  Label,
  Select as DSSelect,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@camunda/design-system';

import DocumentationIcon from './DocumentationIcon';
import FormFeedback from './FormFeedback';

import {
  fieldError as defaultFieldError
} from './Util';

import * as css from './Field.css';

export default function Select(props) {

  const {
    label,
    field,
    fieldError,
    form,
    description,
    documentationUrl,
    placeholder,
    options,
    value = field.value,
    onChange = field.onChange,
    ...restProps
  } = props;

  const {
    name: fieldName
  } = field;

  const meta = form?.getFieldMeta(fieldName);

  const error = (fieldError || defaultFieldError)(meta, fieldName);

  const errorId = `${ fieldName }-error-msg`;
  const descriptionId = `${ fieldName }-description`;

  // select values must be non-empty strings, so use the option index
  const selectedIndex = options.findIndex(option => !option.separator && option.value === value);

  // emulate a native select change for Formik and custom handlers
  const handleValueChange = (index) => onChange({
    target: { name: fieldName, value: options[ index ].value }
  });

  return (
    <div className={ css.Field }>
      <Label htmlFor={ fieldName }>
        { label }
        <DocumentationIcon url={ documentationUrl } />
      </Label>
      <DSSelect
        name={ fieldName }
        value={ selectedIndex === -1 ? '' : String(selectedIndex) }
        onValueChange={ handleValueChange }
        disabled={ form?.isSubmitting }
      >
        <SelectTrigger
          id={ fieldName }
          onBlur={ field.onBlur }
          aria-invalid={ !!error }
          aria-errormessage={ error ? errorId : undefined }
          aria-describedby={ description ? descriptionId : undefined }
          { ...restProps }
        >
          <SelectValue placeholder={ placeholder } />
        </SelectTrigger>
        <SelectContent>
          {
            options.map(({ separator, label }, index) =>
              separator
                ? <SelectSeparator key={ index } />
                : <SelectItem key={ index } value={ String(index) }>{ label }</SelectItem>
            )
          }
        </SelectContent>
      </DSSelect>
      <FormFeedback id={ errorId } error={ error } />
      { description && <div id={ descriptionId } className="field__description">{ description }</div> }
    </div>
  );
}
