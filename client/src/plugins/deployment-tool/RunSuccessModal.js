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

import { Modal, Icon } from '../../app/primitives';

import css from './RunSuccessModal.less';

export default class RunSuccessModal extends React.PureComponent {

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

  toggleDetails = () => this.setState(state => ({ ...state, detailsOpen: !state.detailsOpen }));

  render() {
    const {
      processInstance,
      endpointUrl
    } = this.props;

    const {
      id
    } = processInstance;

    const onClose = this.onClose;

    const baseUrl = getBaseUrl(endpointUrl);

    const cockpitUrl = `${baseUrl}/camunda/app/cockpit/default/#/process-instance/${id}`;

    return (
      <Modal className={ css.RunSuccessModal } onClose={ onClose }>

        <Modal.Title>
            Starting process instance was successful
        </Modal.Title>

        <Modal.Body>
          <div className="cockpit-link">
            <a href={ cockpitUrl }>
              Open Instance in Camunda Cockpit
              <Icon name="open" />
            </a>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}


// helpers //////////////////

function getBaseUrl(url) {
  const [ protocol,, host ] = url.split('/');

  return `${protocol}//${host}`;
}