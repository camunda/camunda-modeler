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

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@camunda/design-system';

import { ExternalLink } from '@camunda/design-system/icons';

import * as css from './DocumentationIcon.css';

export default function DocumentationIcon(props) {

  const {
    url,
    onClick,
    ...rest
  } = props;

  if (!url) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          className={ classNames(css.DocumentationIcon, 'documentation-icon') }
          href={ url }
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open documentation"
          onClick={ onClick }
          { ...rest }
        >
          <ExternalLink aria-hidden="true" />
        </a>
      </TooltipTrigger>
      <TooltipContent side="bottom">Open documentation</TooltipContent>
    </Tooltip>
  );
}
