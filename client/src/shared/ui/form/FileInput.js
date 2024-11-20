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

import DeteleIcon from '../../../../resources/icons/Delete.svg';
import CreateIcon from '../../../../resources/icons/Create.svg';
import BPMNIcon from '../../../../resources/icons/file-types/BPMN.svg';
import DMNIcon from '../../../../resources/icons/file-types/DMN.svg';
import FormIcon from '../../../../resources/icons/file-types/Form.svg';
import ErrorIcon from '../../../../resources/icons/Error.svg';

/**
 * @typedef FileDescriptor
 * @property {Uint8Array|Blob|null} contents
 * @property {string} name
 * @property {number} lastModified
 */

export default function FileInput(props) {
  const {
    field,
    form,
    label
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
    const newValue = uniqueBy(file => fileToKey(file), value, fileDescriptors);

    form.setFieldValue(name, newValue);
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

      <label aria-label={ label } htmlFor={ name }>
        <CreateIcon />
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

/**
 * @param {object} props
 * @param {FileDescriptor[]} props.files
 */
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
          key={ fileToKey(file) } name={ file.name } onRemove={ () => onRemove(file) }
          error={ getIn(formErrors, `${fieldName}[${index}]`) } />
      ))}
    </ul>
  );
}

function ListItem(props) {
  const { error, name, onRemove } = props;

  return (
    <li
      className={ classNames('file-list-item', { 'is-invalid': !!error }) }
      title={ getFileLabel(name, error) }>
      <span className="file-list-item-content">
        {getIconFromFileType(name, error)}
        <span className="file-list-item-name">
          { name }
        </span>
        <button className="remove" type="button" onClick={ onRemove } aria-label={ `Remove ${name}` }>
          <DeteleIcon aria-hidden="true" />
        </button>
      </span>
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
        lastModified: file.lastModified,
        contents: file
      };
    });
}

function getTypeFromFileExtension(name) {
  return name.substring(name.lastIndexOf('.') + 1).toLowerCase();
}

function getFileLabel(name, error) {
  return error ?
    `${error.slice(0, -1)}: ${name}`
    : name;
}

function getIconFromFileType(name, error) {
  const extension = getTypeFromFileExtension(name);

  if (error) return <ErrorIcon className="error-icon" />;

  switch (extension) {
  case 'bpmn':
    return <BPMNIcon />;
  case 'dmn':
    return <DMNIcon />;
  case 'form':
    return <FormIcon />;
  default:
    return <div className="default_file-icon" />;
  }
}

/**
 * @param {FileDescriptor} file
 * @returns {string}
 */
function fileToKey(file) {
  return `${file.name}_${file.lastModified}`;
}
