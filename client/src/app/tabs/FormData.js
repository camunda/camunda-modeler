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

import { Fill } from '../slot-fill';

import classNames from 'classnames';


export function FormData(props) {
  const {
    layout,
    onClosePreview,
    onOpenPreview,
    previewOpen
  } = props;

  const { panel = {} } = layout;

  return <Fill slot="status-bar__file" group="9_linting">
    <button
      className={ classNames(
        'btn',
        {
          'btn--active': panel.open && panel.tab === 'form-data'
        }
      ) }
      onClick={ () => { previewOpen ? onClosePreview() : onOpenPreview(); } }
      title="Toggle Form Data"
    >
      Form Data
    </button>
  </Fill>;
}