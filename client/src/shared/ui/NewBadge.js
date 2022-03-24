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

import css from './NewBadge.less';

export default function NewBadge({ inline = false, anchored = false, top = 0, right = 0, style = {} }) {

  return (
    <div className={ classNames(css.NewBadge, { 'anchored': anchored }, { 'inline': inline }) } style={ { top: top || '0', right: right || '0', ...style } }>New</div>
  );
}
