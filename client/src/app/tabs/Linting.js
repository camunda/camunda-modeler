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

import classnames from 'classnames';

import { Fill } from '../slot-fill';

import ErrorIcon from '../../../resources/icons/Error.svg';

import css from './Linting.less';


export function Linting(props) {
  const {
    layout,
    linting,
    onToggleLinting
  } = props;

  const { panel = {} } = layout;

  const errors = linting.filter(({ category }) => category === 'error').length;

  return <Fill slot="status-bar__file" group="9_linting">
    <button
      className={ classnames(
        css.Linting,
        'btn',
        { 'btn--active': panel.open && panel.tab === 'linting',
          'has-errors': errors > 0
        }
      ) }
      onClick={ onToggleLinting }
      title="Toggle Errors"
    >
      <ErrorIcon />
      { errors } { errors === 1 ? 'error' : 'errors' }
    </button>
  </Fill>;
}