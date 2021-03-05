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

import css from './StartInstanceConfigModal.less';

import {
  Modal,
  TextInput
} from '../../../shared/ui';

import {
  Field,
  Formik
} from 'formik';

export default class StartInstanceConfigModal extends React.PureComponent {

  onClose = (action = 'cancel', data) => this.props.onClose(action, data);

  onCancel = () => this.onClose('cancel');

  onSubmit = (values) => {
    this.onClose('start', values);
  }

  render() {

    const {
      onCancel,
      onClose,
      onSubmit
    } = this;

    const {
      configuration: values,
      title
    } = this.props;

    return (
      <Modal className={ css.StartInstanceDetailsModal } onClose={ onClose }>
        <Formik
          initialValues={ values }
          onSubmit={ onSubmit }
        >
          { form => (
            <form onSubmit={ form.handleSubmit }>

              <Modal.Title>
                {
                  title || 'Start Process Instance'
                }
              </Modal.Title>

              <Modal.Body>
                <p className="intro">
                  Enter details to start a process instance on Camunda Platform. Alternatively, you can start a process instance <a href="https://docs.camunda.org/get-started/quick-start/deploy/#start-a-process-instance">via a Rest Client</a>.
                </p>

                <fieldset>
                  <legend>
                    Details
                  </legend>
                  <div className="fields">
                    <Field
                      name="businessKey"
                      component={ TextInput }
                      label="Business Key"
                      hint="A business key is a domain-specific identifier of a process instance."
                      autoFocus
                    />
                  </div>
                </fieldset>
              </Modal.Body>
              <Modal.Footer>
                <div className="form-submit">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={ onCancel }>
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={ form.isSubmitting }>
                    Start
                  </button>
                </div>
              </Modal.Footer>
            </form>
          )}
        </Formik>
      </Modal>
    );
  }
}
