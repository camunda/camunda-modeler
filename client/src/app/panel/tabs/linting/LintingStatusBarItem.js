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

import { Info, TriangleAlert, XCircle } from '@camunda/design-system/icons';

import { Fill } from '../../../slot-fill';

import * as css from './LintingStatusBarItem.css';


export default function LintingStatusBarItem(props) {
  const {
    layout,
    linting,
    onToggle
  } = props;

  const { panel = {} } = layout;

  const errors = linting.filter(({ category }) => category === 'error').length,
        warnings = linting.filter(({ category }) => category === 'warn').length,
        infos = linting.filter(({ category }) => category === 'info').length;

  return <Fill slot="status-bar__file" group="9_linting">
    <button
      className={ classNames(css.LintingStatusBarItem, 'btn', { 'btn--active': panel.open && panel.tab === 'linting' }) }
      onClick={ onToggle }
      title="Toggle problems view"
    >
      <span className="errors"><CountIcon count={ errors } variant="danger" icon={ XCircle } />{ errors }</span>
      <span className="warnings"><CountIcon count={ warnings } variant="warning" icon={ TriangleAlert } />{ warnings }</span>
      { infos > 0 ? <span className="infos"><CountIcon count={ infos } variant="info" icon={ Info } />{ infos }</span> : null }
    </button>
  </Fill>;
}

function CountIcon({ count, variant, icon: Icon }) {
  return count > 0
    ? <StatusIcon variant={ variant } />
    : <Icon aria-hidden="true" />;
}
