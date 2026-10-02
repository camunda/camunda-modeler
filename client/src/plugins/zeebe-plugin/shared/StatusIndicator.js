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

import { StatusIcon } from '@camunda/design-system';
import { CirclePause, CircleX, Loader2 } from '@camunda/design-system/icons';

import * as css from './StatusIndicator.css';

/**
 * @param {Object} props -
 * @param {'loading' | 'success' | 'error' | 'paused' | 'idle' | string} props.status - The status type that determines which icon to display
 * @param {string} props.text - The text to display next to the status icon
 * @param {boolean} [props.reserveIconSpace=true] - Whether to reserve space for the icon when no status matches to prevent contend shift
 */
export function StatusIndicator({ status, text, reserveIconSpace = true }) {
  let icon;

  switch (status) {
  case 'loading':
    icon = <Loader2 className="status-icon status-icon--loading" role="img" aria-label="Loading" />;
    break;
  case 'success':
    icon = <StatusIcon className="status-icon" variant="success" label="Success" />;
    break;
  case 'error':
    icon = <StatusIcon className="status-icon" variant="danger" label="Error" />;
    break;
  case 'paused':
    icon = <CirclePause className="status-icon status-icon--muted" role="img" aria-label="Paused" />;
    break;
  case 'idle':
    icon = <CircleX className="status-icon status-icon--muted" role="img" aria-label="Idle" />;
    break;
  default:
    icon = reserveIconSpace ? <span className={ 'status-icon placeholder' } /> : null;
  }

  return <div className={ css.StatusIndicator }>
    {icon}
    <span>{text}</span>
  </div>;
}
