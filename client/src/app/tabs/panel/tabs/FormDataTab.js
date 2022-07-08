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

import { useCallback } from 'react';

import Panel from '../Panel';

import classNames from 'classnames';

import css from './FormDataTab.less';


export default function FormDataTab(props) {
  const {
    layout,
    onLayoutChanged,
    onAttachContainers
  } = props;

  /* https://stackoverflow.com/questions/55838351/how-do-we-know-when-a-react-ref-current-value-has-changed */
  const onDataContainerChange = useCallback((node) => {
    onAttachContainers({
      dataContainer: node
    });
  });

  const onResultContainerChange = useCallback((node) => {
    onAttachContainers({
      resultContainer: node
    });
  });

  return <Panel.Tab
    id="form-data"
    label="Form Data"
    layout={ layout }
    onLayoutChanged={ onLayoutChanged }
    priority={ 1 }>
    <div className={ css.FormDataTab }>
      <div
        ref={ onDataContainerChange }
        className={ classNames('fjs-pgl-text-container', 'data-container') }></div>
      <div
        ref={ onResultContainerChange }
        className={ classNames('fjs-pgl-text-container', 'data-container') }></div>
    </div>
  </Panel.Tab>;
}