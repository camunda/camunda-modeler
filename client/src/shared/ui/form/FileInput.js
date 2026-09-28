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

import { IconButton } from '@camunda/design-system';
import { CircleAlert, File, Plus, Trash2 } from '@camunda/design-system/icons';

import BPMNIcon from '../../../../resources/icons/file-types/BPMN.svg';
import DMNIcon from '../../../../resources/icons/file-types/DMN.svg';
import FormIcon from '../../../../resources/icons/file-types/Form.svg';

import * as css from './FileInput.css';

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
    <div className={ css.FileInput }>
      <input
        name={ name }
        id={ name }
        onBlur={ onBlur }
        onChange={ onChange }
        multiple
        hidden
        type="file"
        ref={ inputRef }
      />

      <IconButton
        className="file-input__add"
        type="button"
        variant="ghost"
        size="xs"
        label={ label }
        icon={ Plus }
        onClick={ () => inputRef.current.click() }
      />

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
      { getIconFromFileType(name, error) }
      <span className="file-list-item-name">
        { name }
      </span>
      <IconButton
        className="remove"
        type="button"
        variant="ghost"
        size="xs"
        label={ `Remove ${name}` }
        icon={ Trash2 }
        onClick={ onRemove }
      />
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

  if (error) return <CircleAlert className="error-icon" aria-hidden="true" />;

  switch (extension) {
  case 'bpmn':
    return <BPMNIcon />;
  case 'dmn':
    return <DMNIcon />;
  case 'form':
    return <FormIcon />;
  default:
    return <File aria-hidden="true" />;
  }
}

/**
 * @param {FileDescriptor} file
 * @returns {string}
 */
function fileToKey(file) {
  return `${file.name}_${file.lastModified}`;
}
