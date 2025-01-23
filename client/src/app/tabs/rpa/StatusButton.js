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

import { ConfigurationDialog, WorkerStatus } from '@camunda/rpa-integration';

export default function StatusButton(props) {

  const editor = props.editor || {};

  const eventBus = editor.eventBus;

  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  useEffect(() => {
    const cb = () => {
      setIsOpen(true);
    };

    eventBus?.on('dialog.config.open', cb);

    return () => {
      eventBus?.off('dialog.config.open', cb);
    };
  }, [ eventBus ]);

  const onClose = () => {
    setIsOpen(false);
  };

  return <>
    {
      <Fill slot="status-bar__file" group="8_deploy" priority={ 40 }>
        <button
          ref={ buttonRef }
          onClick={ () => setIsOpen(!isOpen) }
          title="Configure RPA Runtime"
          className={ classNames('btn', { 'btn--active': isOpen }) }
        >
          <WorkerStatus editor={ editor } />
        </button>
      </Fill>
    }
    { isOpen &&
      <Overlay
        minWidth={ 600 }
        onClose={ onClose }
        anchor={ buttonRef.current }
      >
        <div style={ { padding: '12px' } }>
          <ConfigurationDialog
            editor={ editor }
          />
        </div>
      </Overlay>
    }
  </>;
}