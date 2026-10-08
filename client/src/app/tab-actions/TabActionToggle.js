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

import {
  Toggle,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@camunda/design-system';

/**
 * Toggles a panel from the tab actions bar.
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {React.ComponentType} props.icon
 * @param {boolean} props.pressed
 * @param {Function} props.onClick
 */
export default function TabActionToggle(props) {
  const {
    label,
    icon: Icon,
    pressed,
    onClick
  } = props;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          className="btn--tab-action"
          variant="outline"
          size="sm"
          pressed={ pressed }
          aria-label={ label }
          onClick={ onClick }
        >
          <Icon aria-hidden="true" />
        </Toggle>
      </TooltipTrigger>
      <TooltipContent side="bottom">{ label }</TooltipContent>
    </Tooltip>
  );
}
