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

import { Eye, PencilRuler } from '@camunda/design-system/icons';

import { FORM_PREVIEW_TRIGGER } from './FormEditor';

import * as css from './FormPreviewToggle.css';


export function FormPreviewToggle(props) {

  const {
    onCollapsePreview,
    onOpenPreview,
    previewOpen
  } = props;

  const handleCollapse = () => {
    onCollapsePreview({
      triggeredBy: FORM_PREVIEW_TRIGGER.STATUS_BAR
    });
  };

  const handleOpen = () => {
    onOpenPreview({
      triggeredBy: FORM_PREVIEW_TRIGGER.STATUS_BAR
    });
  };

  return <Fill slot="status-bar__app" group="1_form-preview">
    <div className={ classnames(css.FormPreviewToggle) }>
      <button
        className={ classnames('btn', { 'btn--active': !previewOpen }) }
        title="Open design mode"
        onClick={ handleCollapse }
      >
        <PencilRuler /> Design
      </button>
      <button
        className={ classnames('btn', { 'btn--active': previewOpen }) }
        title="Open validation mode"
        onClick={ handleOpen }
      >
        <Eye /> Validate
      </button>
    </div>
  </Fill>;
}
