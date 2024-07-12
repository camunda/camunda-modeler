/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useMemo } from 'react';

import * as css from './CockpitLink.less';

function combineUrlSegments(url, path, query) {
  if (!url) {
    return null;
  }

  if (query) {
    return `${url}${path}${query}`;
  } else {
    return `${url}${path}`;
  }
}

export default function CockpitLink(props) {
  const {
    cockpitUrl,
    path = '',
    query = '',
    children
  } = props;

  const link = useMemo(() => combineUrlSegments(cockpitUrl, path, query), [ cockpitUrl, path, query ]);

  return (
    <div className={ css.CockpitLink }>
      { children }
      { link ? <a href={ link }>Open in Camunda Cockpit</a> : null }
    </div>
  );
}
