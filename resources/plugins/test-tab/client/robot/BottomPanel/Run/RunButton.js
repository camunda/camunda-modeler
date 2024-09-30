/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useRef } from 'camunda-modeler-plugin-helpers/react';

import classNames from 'classnames';

import RunIcon from 'icons/Play.svg';

import * as css from './DeploymentPlugin.less';
import { Fill, Overlay } from 'camunda-modeler-plugin-helpers/components';

import RunForm from './RunForm';
import { Chemistry } from '@carbon/react/icons';


export default function RunButtonFill(props) {

  const {
    layout,
    onAction
  } = props;

  const buttonRef = useRef();

  const { panel = {} } = layout;

  const onToggle = () => {

    if (!panel.open || panel.tab !== 'robot-output') {
      onAction('open-panel', { tab: 'robot-output' });
    } else if (panel.tab === 'robot-output') {
      onAction('close-panel');
    }
  };

  return <>
    <Fill slot="status-bar__file" group="8_deploy" priority={ 10 }>
      <button
        ref={ buttonRef }
        onClick={ () => onToggle() }
        title="Test ROBOT script"
        className={ classNames('btn', css.DeploymentPlugin, { 'btn--active': panel.open && panel.tab === 'robot-output' }) }
      >
        <Chemistry />
      </button>
    </Fill>
  </>;
}

export function RunButton(props) {
  const [ cachedValues, setCachedValues ] = useState({});
  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  const onClose = () => {
    setIsOpen(false);
  };


  return <>
    <span
      ref={ buttonRef }
      onClick={ () => setIsOpen(!isOpen) }

      // title="Run robot script"
      // className={ classNames('btn', css.DeploymentPlugin, { 'btn--active': isOpen }) }
    >
      <RunIcon className="icon" />
    </span>
    { isOpen &&
    <Overlay
      offset={ { left: -300 } }
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