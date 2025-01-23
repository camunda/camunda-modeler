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
import TestIcon from './resources/TestIcon.svg';

export default function RunButton(props) {
  const {
    layout,
    onAction
  } = props;

  const editor = props.editor || {};

  const eventBus = editor.eventBus;

  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  useEffect(() => {
    const cb = () => {
      setIsOpen(true);
    };

    eventBus?.on('dialog.run.open', cb);

    return () => {
      eventBus?.off('dialog.run.open', cb);
    };
  }, [ eventBus ]);

  const onClose = () => {
    setIsOpen(false);
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== 'RPA-output') {
      onAction('open-panel', { tab: 'RPA-output' });
    }
  };

  return <>
    {
      <Fill slot="status-bar__file" group="8_deploy" priority={ 30 }>
        <button
          ref={ buttonRef }
          onClick={ () => setIsOpen(!isOpen) }
          title="Test RPA script"
          className={ classNames('btn', { 'btn--active': isOpen }) }
        >
          <TestIcon />
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