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

import { Loading } from '@carbon/react';
import { CheckmarkFilled, ErrorFilled, PauseOutlineFilled, } from '@carbon/icons-react';

import * as css from './StatusIndicator.less';

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
    icon = <Loading small={ true } withOverlay={ false } className={ 'status-icon loading' } aria-label="Loading" />;
    break;
  case 'success':
    icon = <CheckmarkFilled className={ 'status-icon success' } aria-label="Success" />;
    break;
  case 'error':
    icon = <ErrorFilled className={ 'status-icon error' } aria-label="Error" />;
    break;
  case 'paused':
    icon = <PauseOutlineFilled className={ 'status-icon paused' } aria-label="Paused" />;
    break;
  case 'idle':
    icon = <ErrorFilled className={ 'status-icon idle' } aria-label="Idle" />;
    break;
  default:
    icon = reserveIconSpace ? <span className={ 'status-icon placeholder' } /> : null;
    break;
  }

  return <div className={ css.StatusIndicator }>
    {icon}
    <span>{text}</span>
  </div>;
}
