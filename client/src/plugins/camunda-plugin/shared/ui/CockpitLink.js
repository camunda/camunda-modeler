/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Children, useEffect, useMemo, useState } from 'react';
import { forEngineRestUrl } from '../WellKnownAPI';

import * as css from './CockpitLink.less';

export default function CockpitLink(props) {
  const {
    engineRestUrl,
    cockpitPath = '',
    cockpitQuery = '',
    children
  } = props;

  const [ cockpitBaseUrl, setCockpitBaseUrl ] = useState();
  useEffect(() => {
    forEngineRestUrl(engineRestUrl)
      .getCockpitUrl()
      .then(url => {
        console.debug(`Using cockpit url from well known endpoint: ${url}`);
        setCockpitBaseUrl(url);
      })
      .catch(e => {
        const fallbackUrl = getCockpitBaseUrl(engineRestUrl);
        console.debug(`An error occured retrieving the cockpit url from well known endpoint, falling back to ${fallbackUrl}. Cause: ${e}`);
        setCockpitBaseUrl(fallbackUrl);
      });
  }, [ engineRestUrl ]);

  const link = useMemo(() => {
    if (!cockpitBaseUrl) {
      return null;
    }

    if (cockpitQuery) {
      return `${cockpitBaseUrl}${cockpitPath}${cockpitQuery}`;
    } else {
      return `${cockpitBaseUrl}${cockpitPath}`;
    }
  }, [ cockpitBaseUrl, cockpitPath, cockpitQuery ]);

  return (
    <div className={ css.CockpitLink }>
      { Children.toArray(children) }
      {
        link
          ? (
            <a href={ link }>
              Open in Camunda Cockpit
            </a>
          ) : null
      }
    </div>
  );
}

// helpers //////////

function getCockpitBaseUrl(url) {
  const [ protocol,, host, restRoot ] = url.split('/');

  return isTomcat(restRoot) ? `${protocol}//${host}/camunda/app/cockpit/` : `${protocol}//${host}/cockpit/`;
}

function isTomcat(restRoot) {
  return restRoot === 'engine-rest';
}
