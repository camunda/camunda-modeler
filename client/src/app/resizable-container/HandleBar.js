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

/**
 * Handle shown on the edge of a closed panel that opens horizontally. The
 * shape is filled, so it can be colored through the CSS `fill` property.
 *
 * @param {React.SVGProps<SVGSVGElement>} props
 */
export function HandleBarX(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="64" viewBox="0 0 9 64" { ...props }>
      <path
        fillRule="evenodd"
        d="M.343 32 6 26.343V1.5a1.5 1.5 0 1 1 3 0v61a1.5 1.5 0 1 1-3 0V37.657z" />
    </svg>
  );
}

/**
 * Handle shown on the edge of a closed panel that opens vertically. The shape
 * is filled, so it can be colored through the CSS `fill` property.
 *
 * @param {React.SVGProps<SVGSVGElement>} props
 */
export function HandleBarY(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="9" viewBox="0 0 64 9" { ...props }>
      <path
        fillRule="evenodd"
        d="M32 .343 37.657 6H62.5a1.5 1.5 0 0 1 0 3h-61a1.5 1.5 0 0 1 0-3h24.843z" />
    </svg>
  );
}
