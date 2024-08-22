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

import RunIcon from 'icons/Play.svg';

import * as css from './DeploymentPlugin.less';
import { Fill } from '../../../../slot-fill';
import { Overlay } from '../../../../../shared/ui';
import RunForm from './RunForm';


export default function RunButton(props) {

  const [ cachedValues, setCachedValues ] = useState({});
  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  const onClose = () => {
    setIsOpen(false);
  };

  return <>
    {
      <Fill slot="status-bar__file" group="9_deploy" priority={ 2 }>
        <button
          ref={ buttonRef }
          onClick={ () => setIsOpen(!isOpen) }
          title="Run robot script"
          className={ classNames('btn', css.DeploymentPlugin, { 'btn--active': isOpen }) }
        >
          <RunIcon className="icon" />
        </button>
      </Fill>
    }
    { isOpen &&
      <Overlay
        onClose={ onClose }
        anchor={ buttonRef.current }
      >
        <RunForm
          cachedValues={ cachedValues }
          setCachedValues={ setCachedValues }
          onClose={ onClose }
          { ...props }
        />
      </Overlay>
    }
  </>;
}