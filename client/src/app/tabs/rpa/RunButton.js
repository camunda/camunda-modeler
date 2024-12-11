/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import { Overlay } from '../../../shared/ui';
import { Fill } from '../../slot-fill';
import classNames from 'classnames';

import { RunDialog } from '@camunda/rpa-integration';

export default function RunButton(props) {

  const editor = props.editor || {};

  const eventBus = editor.eventBus;

  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  useEffect(() => {
    const cb = () => {
      setIsOpen(true);
    };

    eventBus?.on('open-run-dialog', cb);

    return () => {
      eventBus?.off('open-run-dialog', cb);
    };
  }, [ eventBus ]);

  const onClose = () => {
    setIsOpen(false);
  };

  return <>
    {
      <Fill slot="status-bar__file" group="8_deploy" priority={ 1 }>
        <button
          ref={ buttonRef }
          onClick={ () => setIsOpen(!isOpen) }
          title="Test robot script"
          className={ classNames('btn', 'RobotDeploymentPlugin', { 'btn--active': isOpen }) }
        >
          ▶
        </button>
      </Fill>
    }
    { isOpen &&
      <Overlay
        onClose={ onClose }
        anchor={ buttonRef.current }
      >
        <div style={ { padding: '12px' } }>
          <RunDialog
            editor={ editor }
            onSubmit={ onClose }
          />
        </div>
      </Overlay>
    }
  </>;
}