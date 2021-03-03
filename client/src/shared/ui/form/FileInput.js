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

import { uniqueBy } from 'min-dash';

import { getIn } from 'formik';
import classNames from 'classnames';

import CloseIcon from '../../../../resources/icons/Close.svg';
import FormFeedback from './FormFeedback';

/**
 * @typedef FileDescriptor
 * @property {Uint8Array|Blob|null} contents
 * @property {string} name
 * @property {string} path
 */

export default function FileInput(props) {
  const {
    label,
    field,
    form
  } = props;

  const {
    name,
    value,
    onBlur
  } = field;

  const inputRef = React.useRef(null);

  function onChange() {
    const { files } = inputRef.current;
    const fileDescriptors = toFileDescriptors(files);

    form.setFieldValue(name, uniqueBy('path', value, fileDescriptors));
  }

  function removeFile(fileToRemove) {
    form.setFieldValue(name, field.value.filter(file => file !== fileToRemove));
  }

  return (
    <div className="form-group">
      <input
        className="form-control"
        name={ name }
        id={ name }
        onBlur={ onBlur }
        onChange={ onChange }
        multiple
        type="file"
        ref={ inputRef }
      />

      <label className="btn" htmlFor={ name }>
        {label}
      </label>

      <FileList
        errors={ form.errors }
        fieldName={ name }
        files={ value }
        onRemove={ removeFile }
      />
    </div>
  );
}

function FileList(props) {
  const {
    errors: formErrors,
    fieldName,
    files,
    onRemove
  } = props;

  const invalid = !!getIn(formErrors, fieldName);

  return (
    <ul className={ classNames('file-list', { 'is-invalid': invalid }) }>
      { files.map((file, index) => (
        <ListItem
          key={ file.path } name={ file.name } onRemove={ () => onRemove(file) }
          error={ getIn(formErrors, `${fieldName}[${index}]`) } />
      ))}
    </ul>
  );
}

function ListItem(props) {
  const { error, name, onRemove } = props;

  return (
    <li className={ classNames('file-list-item', { 'is-invalid': !!error }) }>
      <span className="file-list-item-content">
        { name }
        { error ? <span className="error">{'- ' + error}</span> : null }
        <button className="remove" type="button" onClick={ onRemove } aria-label={ `Remove ${name}` }>
          <CloseIcon aria-hidden="true" />
        </button>
      </span>
      <FormFeedback error={ error } />
    </li>
  );
}

/**
 *
 * @param {FileList} fileList
 * @returns {FileDescriptor}
 */
function toFileDescriptors(fileList) {
  return Array.from(fileList)
    .map(file => {
      return {
        name: file.name,
        path: file.path,
        lastModified: file.lastModified,
        contents: file
      };
    });
}
