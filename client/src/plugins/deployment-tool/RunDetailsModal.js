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

import { Modal } from '../../app/primitives';

import css from './RunDetailsModal.less';

import {
  FormControl
} from './components';

import {
  Field,
  Form,
  Formik
} from 'formik';

const initialFormValues = {
  businessKey: ''
};

export default class RunDetailsModal extends React.PureComponent {

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  validate = values => {
    const errors = this.props.validate(values);

    return errors;
  }

  onClose = () => this.props.onClose();

  onSubmit = (values) => {
    this.props.onClose(values);
  }

  getInitialValues() {
    return { ...initialFormValues, ...this.props.details };
  }

  render() {
    const {
      onFocusChange
    } = this.props;

    const initialValues = this.getInitialValues();

    const onClose = this.onClose;
    const onSubmit = this.onSubmit;

    return (
      <Modal className={ css.RunDetailsModal } onClose={ onClose }>
        <Formik
          initialValues={ initialValues }
          onSubmit={ onSubmit }
          validate={ this.validate }
        >
          {({ isSubmitting }) => (
            <Form>
              <Modal.Header>
                <Modal.Title>
                  Run Process Instance
                </Modal.Title>

                <Modal.Close onClick={ onClose }></Modal.Close>
              </Modal.Header>

              <Modal.Body>

                <p className="intro">
                  Start a Process Instance on the <a href="https://camunda.com/products/bpmn-engine/">Camunda Engine</a>.
                </p>

                <div className="deploy-success">
                    Deployed successfully.
                </div>

                <fieldset>

                  <legend>
                    Run Details
                  </legend>

                  <div className="fields">
                    <Field
                      name="businessKey"
                      component={ FormControl }
                      label="Business Key"
                      validated
                      autoFocus
                      onFocusChange={ onFocusChange }
                    />
                  </div>
                </fieldset>

              </Modal.Body>
              <Modal.Footer>

                <div className="form-submit">

                  <button
                    className="btn btn-light"
                    type="button"
                    onClick={ onClose }
                  >
                  Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={ isSubmitting }>
                  Run
                  </button>
                </div>
              </Modal.Footer>
            </Form>
          )}
        </Formik>
      </Modal>
    );
  }
}