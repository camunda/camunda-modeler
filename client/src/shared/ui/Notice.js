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

import classNames from 'classnames';

import { CheckmarkFilled, ErrorFilled, InformationFilled, WarningFilled } from '@carbon/icons-react';

import * as css from './Notice.css';

const ICONS = {
  info: InformationFilled,
  success: CheckmarkFilled,
  warning: WarningFilled,
  error: ErrorFilled
};

/**
 * A notice inside of a dialog, e.g. "restart required".
 *
 * Sticks to the top of the scrolling modal body, so it stays visible while
 * the dialog is scrolled.
 *
 * @param {Object} props
 * @param {'info' | 'success' | 'warning' | 'error'} props.type
 * @param {React.ReactNode} [props.icon] - custom icon, replacing the type's default
 * @param {React.ReactNode} props.children
 */
export default function Notice({ type = 'info', icon, children }) {
  const DefaultIcon = ICONS[type] || ICONS.info;

  return <div className={ classNames(css.Notice, type) } role="status">
    <span className="icon">{ icon || <DefaultIcon aria-label={ type } size={ 16 } /> }</span>
    <div className="content">{ children }</div>
  </div>;
}
