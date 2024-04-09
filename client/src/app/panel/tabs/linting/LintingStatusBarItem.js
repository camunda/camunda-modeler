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

import { Fill } from '../../../slot-fill';

import ErrorIcon from '../../../../../resources/icons/Error.svg';
import WarningIcon from '../../../../../resources/icons/Warning.svg';
import InfoIcon from '../../../../../resources/icons/InformationCircle.svg';

import * as css from './LintingStatusBarItem.less';


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
      className={ classnames(
        css.LintingStatusBarItem,
        'btn',
        { 'btn--active': panel.open && panel.tab === 'linting',
          'has-errors': errors > 0,
          'has-warnings': warnings > 0,
          'has-infos': infos > 0
        }
      ) }
      onClick={ onToggle }
      title="Toggle problems view"
    >
      <span className="errors"><ErrorIcon width="16" height="16" />{ errors }</span>
      <span className="warnings"><WarningIcon width="16" height="16" />{ warnings }</span>
      { infos > 0 ? <span className="infos"><InfoIcon width="16" height="16" />{ infos }</span> : null }
    </button>
  </Fill>;
}
