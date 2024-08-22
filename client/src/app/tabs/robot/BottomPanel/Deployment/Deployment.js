/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useRef } from 'react';

import classNames from 'classnames';

import DeployIcon from 'icons/Deploy.svg';

import * as css from './DeploymentPlugin.less';
import { Fill } from '../../../../slot-fill';
import { Overlay } from '../../../../../shared/ui';
import DeploymentForm from './DeploymentForm';


export default function DeploymentButton(props) {

  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  const onClose = () => {
    setIsOpen(false);
  };

  return <>
    {
      <Fill slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          ref={ buttonRef }
          onClick={ () => setIsOpen(!isOpen) }
          title="Deploy robot script"
          className={ classNames('btn', css.DeploymentPlugin, { 'btn--active': isOpen }) }
        >
          <DeployIcon className="icon" />
        </button>
      </Fill>
    }
    { isOpen &&
      <Overlay
        onClose={ onClose }
        anchor={ buttonRef.current }
      >
        <DeploymentForm onClose={ onClose }{ ...props } />
      </Overlay>
    }
  </>;
}