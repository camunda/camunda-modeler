/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Children, useMemo } from 'react';

import * as css from './CockpitLink.less';

export default function CockpitLink(props) {
  const {
    engineRestUrl,
    cockpitPath,
    children
  } = props;

  const cockpitBaseUrl = useMemo(() => {

    // TODO Integrate well known endpoint base url for Camunda Web Apps
    const webAppsBaseUrl = getWebAppsBaseUrl(engineRestUrl);

    // TODO ensure a single slash between base url and relative path segment
    return webAppsBaseUrl + '/cockpit/default/#';
  }, [ engineRestUrl ]);

  // TODO ensure a single slash between base url and relative path segment
  const link = useMemo(() => `${cockpitBaseUrl}${cockpitPath}`);

  return (
    <div className={ css.CockpitLink }>
      { Children.toArray(children) }
      <a href={ link }>
        Open in Camunda Cockpit
      </a>
    </div>
  );
}

// helpers //////////

function getWebAppsBaseUrl(url) {
  const [ protocol,, host, restRoot ] = url.split('/');

  return isTomcat(restRoot) ? `${protocol}//${host}/camunda/app` : `${protocol}//${host}/app`;
}

function isTomcat(restRoot) {
  return restRoot === 'engine-rest';
}
