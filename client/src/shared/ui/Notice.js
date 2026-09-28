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

import { StatusIcon } from '@camunda/design-system';

import * as css from './Notice.css';

const ICON_VARIANTS = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'danger'
};

/**
 * A notice inside of a dialog, e.g. "restart required".
 *
 * Render it between `Modal.Title` and `Modal.Body`, so it stays visible while
 * the body is scrolled.
 *
 * @param {Object} props
 * @param {'info' | 'success' | 'warning' | 'error'} props.type
 * @param {React.ReactNode} [props.icon] - custom icon, replacing the type's default
 * @param {React.ReactNode} props.children
 */
export default function Notice({ type = 'info', icon, children }) {
  const iconType = ICON_VARIANTS[type] ? type : 'info';

  return <div className={ classNames(css.Notice, type) } role="status">
    <span className="icon">{ icon || <StatusIcon variant={ ICON_VARIANTS[iconType] } label={ iconType } /> }</span>
    <div className="content">{ children }</div>
  </div>;
}
