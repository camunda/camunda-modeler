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

import { Form, Formik } from 'formik';
import { ContainedList, ContainedListItem } from '@carbon/react';

import { Modal } from '../../shared/ui';

import * as css from './SettingsList.css';


/**
 * A list of settings entries, e.g. connections, each rendered
 * as a `SettingsListItem`.
 */
export function SettingsList({ className, children }) {
  return <ContainedList className={ classNames(css.SettingsList, className) }>
    { children }
  </ContainedList>;
}

/**
 * A two-line settings list entry with actions, e.g. a toggle and an `OptionsMenu`.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {React.ReactNode} props.name
 * @param {string} [props.description]
 * @param {boolean} [props.invalid] - whether the description reports an error
 * @param {React.ReactNode} [props.actions]
 */
export function SettingsListItem({ id, name, description, invalid, actions }) {
  return <ContainedListItem
    id={ id }
    action={ actions && <span className="settings-list-item__actions">{ actions }</span> }
  >
    <span className="settings-list-item__name">{ name }</span>
    { description && <span
      className={ classNames('settings-list-item__description', { 'settings-list-item__description--error': invalid }) }
      title={ description }
    >
      { description }
    </span> }
  </ContainedListItem>;
}

/**
 * A dialog to add or edit a settings list entry, with its own form.
 *
 * Submitting is possible once the form is valid and, when editing, changed.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {boolean} props.adding - whether a new entry is added
 * @param {Object} props.initialValues
 * @param {(values: Object) => Object} [props.validate]
 * @param {(values: Object) => void} props.onSubmit
 * @param {() => void} props.onClose
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export function SettingsListDialog(props) {
  const {
    title,
    adding,
    initialValues,
    validate,
    onSubmit,
    onClose,
    className,
    children
  } = props;

  return <Modal className={ classNames(css.SettingsListDialog, className) } onClose={ onClose }>
    <Formik
      initialValues={ initialValues }
      validate={ validate }
      validateOnMount
      onSubmit={ onSubmit }
    >
      { ({ isValid, dirty }) => <Form>
        <Modal.Title>{ title }</Modal.Title>
        <Modal.Body>
          { children }
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={ onClose }>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={ !isValid || (!adding && !dirty) }>
            { adding ? 'Add' : 'Save' }
          </button>
        </Modal.Footer>
      </Form> }
    </Formik>
  </Modal>;
}
