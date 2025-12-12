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

import { Tooltip } from '@carbon/react';

import LaunchIcon from '../../../../resources/icons/Launch.svg';

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
    <Tooltip label="Open documentation" align="bottom">
      <a
        className="documentation-icon"
        href={ url }
        target="_blank"
        rel="noopener noreferrer"
        onClick={ onClick }
        { ...rest }
      >
        <LaunchIcon width="12" height="12" viewBox="0 0 12 12" />
      </a>
    </Tooltip>
  );
}
