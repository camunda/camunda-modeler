/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import { OverlayDropdown } from '../../shared/ui';

import { Fill } from '../../app/slot-fill';

import PlusIcon from '../../../resources/icons/Plus.svg';

const OVERLAY_OFFSET = { top: 0, right: 0 };
const OVERLAY_MIN_WIDTH = '160px';


export class CreateNewAction extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      open: false
    };
  }

  componentDidMount() {
    const {
      subscribe
    } = this.props;

    subscribe('createNewAction.open', () => {
      this.open();
    });
  }

  open() {
    this.setState({ open: true });
  }

  onClose = () => {
    this.setState({ open: false });
  };

  render() {
    const {
      newFileItems = []
    } = this.props;

    const {
      open
    } = this.state;

    const buttonRef = React.createRef();

    const overlayConfig = {
      offset: OVERLAY_OFFSET,
      minWidth: OVERLAY_MIN_WIDTH
    };

    return (
      <OverlayDropdown
        className="btn--tab-action"
        items={ newFileItems }
        title="Create new ..."
        buttonRef={ buttonRef }
        overlayConfig={ overlayConfig }
        shouldOpen={ open }
        onClose={ this.onClose }
      >
        <PlusIcon />
      </OverlayDropdown>
    );
  }
}

export function CreateNewActionPlugin(props) {
  const {
    _getFromApp
  } = props;

  const newFileItems = _getFromApp('_getNewFileItems')();

  return (
    <Fill slot="tab-actions" priority={ 2 }>
      <CreateNewAction newFileItems={ newFileItems } { ...props } />
    </Fill>
  );
}