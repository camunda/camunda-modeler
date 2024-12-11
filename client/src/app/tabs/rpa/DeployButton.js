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

import DeployIcon from 'icons/Deploy.svg';


import { Overlay } from '../../../shared/ui';
import { Fill } from '../../slot-fill';
import classNames from 'classnames';

export default function DeployButton(props) {
  const editor = props.editor || {};

  const eventBus = editor.eventBus;

  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  const onClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const cb = () => {
      setIsOpen(true);
    };

    eventBus?.on('dialog.run.open', cb);

    return () => {
      eventBus?.off('dialog.run.open', cb);
    };
  }, [ eventBus ]);

  return <>
    {
      <Fill slot="status-bar__file" group="8_deploy" priority={ 10 }>
        <button
          ref={ buttonRef }
          onClick={ () => setIsOpen(!isOpen) }
          title="Deploy RPA"
          className={ classNames('btn', { 'btn--active': isOpen }) }
        >
          <DeployIcon
            style={ {
              width: '24px',
              height: '24px',
              fill: 'var(--status-bar-icon-font-color)'
            } }
            className="icon"
          />
        </button>
      </Fill>
    }
    { isOpen &&
      <Overlay
        anchor={ buttonRef.current }
        onClose={ onClose }
      >
        <div style={ { padding: '12px' } }>
          {/* TODO: Add deploy dialog */}
          <h1>Coming Soon</h1>
        </div>
      </Overlay>
    }
  </>;
}