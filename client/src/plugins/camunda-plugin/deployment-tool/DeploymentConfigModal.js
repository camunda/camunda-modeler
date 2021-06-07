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

import { createForm } from '@bpmn-io/form-js';
import '@bpmn-io/form-js/dist/assets/form-js.css';

import css from './DeploymentConfigModal.less';

import {
  Modal
} from '../../../shared/ui';

import formSchema from './deploymentForm.form';


export default class DeploymentConfigModal extends React.PureComponent {

  constructor(props) {
    super(props);

    this._formRef = React.createRef(null);
  }

  componentDidMount = () => {
    const data = this.getInitialValues();

    this._form = createForm({
      schema: JSON.parse(formSchema),
      container: this._formRef.current,
      data
    });
  }

  onClose = () => {
    this.props.onClose('cancel');
  }

  onSubmit = async () => {
    const { data, errors } = this._form.submit();

    if (hasKeys(errors)) {
      return;
    }

    const configuration = this.getConfigurationFromFormValues(data);

    this.props.onClose('deploy', configuration);
  }

  getConfigurationFromFormValues(formValues) {
    const endpoint = {
      url: formValues.endpointUrl,
      authType: formValues.authType,
      rememberCredentials: formValues.rememberCredentials
    };

    const deployment = {
      name: formValues.deploymentName,
      tenantId: formValues.tenantId,
      attachments: []
    };

    return {
      endpoint,
      deployment
    };
  }

  getInitialValues() {
    const { configuration: { endpoint, deployment } } = this.props;

    return {
      endpointUrl: endpoint.url,
      authType: endpoint.authType,
      rememberCredentials: endpoint.rememberCredentials,
      deploymentName: deployment.name,
      tenantId: deployment.tenantId,
      attachments: deployment.attachments
    };
  }

  render() {
    const {
      onClose,
      onSubmit
    } = this;

    const {
      title,
      intro,
      primaryAction
    } = this.props;

    return (
      <Modal className={ css.DeploymentConfigModal } onClose={ () => {
        onClose();
      } }>
        <Modal.Title>
          {
            title || 'Deploy Diagram to Camunda Platform'
          }
        </Modal.Title>

        <Modal.Body>
          {
            intro && (
              <p className="intro">
                { intro }
              </p>
            )
          }

          <div ref={ this._formRef } />
        </Modal.Body>

        <Modal.Footer>
          <div className="form-submit">

            <button
              type="button"
              className="btn btn-secondary"
              onClick={ () => {
                onClose('cancel', null, false);
              } }
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              onClick={ onSubmit }
            >
              { primaryAction || 'Deploy' }
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  }
}

function hasKeys(obj) {
  return obj && Object.keys(obj).length > 0;
}
