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

import { Button } from '@camunda/design-system';

import { Modal } from '../../shared/ui';

import * as css from './SettingsList.css';


/**
 * A list of settings entries, e.g. connections, each rendered
 * as a `SettingsListItem`.
 */
export function SettingsList({ className, children }) {
  return <ul className={ classNames(css.SettingsList, className) }>
    { children }
  </ul>;
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
  return <li id={ id } className="settings-list-item">
    <div className="settings-list-item__content">
      <span className="settings-list-item__name">{ name }</span>
      { description && <span
        className={ classNames('settings-list-item__description', { 'settings-list-item__description--error': invalid }) }
        title={ description }
      >
        { description }
      </span> }
    </div>
    { actions && <span className="settings-list-item__actions">{ actions }</span> }
  </li>;
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
 * @param {React.ReactNode} [props.notice] - a `Notice`, shown above the form fields
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
    notice,
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
        { notice }
        <Modal.Body>
          { children }
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={ onClose }>Cancel</Button>
          <Button type="submit" disabled={ !isValid || (!adding && !dirty) }>
            { adding ? 'Add' : 'Save' }
          </Button>
        </Modal.Footer>
      </Form> }
    </Formik>
  </Modal>;
}
