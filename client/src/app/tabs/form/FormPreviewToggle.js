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

import { Fill } from '../../slot-fill';

import DesignIcon from '../../../../resources/icons/Design.svg';
import ValidateIcon from '../../../../resources/icons/Validate.svg';

import css from './FormPreviewToggle.less';


export function FormPreviewToggle(props) {

  const {
    onCollapsePreview,
    onOpenPreview,
    previewOpen
  } = props;

  return <Fill slot="status-bar__app" group="1_form-preview">
    <div className={ classnames(css.FormPreviewToggle) }>
      <button
        className={ classnames('btn', { 'btn--active': !previewOpen }) }
        title="Open design"
        onClick={ onCollapsePreview }
      >
        <DesignIcon /> Design
      </button>
      <button
        className={ classnames('btn', { 'btn--active': previewOpen }) }
        title="Open validation"
        onClick={ onOpenPreview }
      >
        <ValidateIcon /> Validate
      </button>
    </div>
  </Fill>;
}