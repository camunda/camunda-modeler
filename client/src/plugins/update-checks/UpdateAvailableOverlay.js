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

import { Overlay, Section } from '../../shared/ui';

import * as css from './UpdateAvailableOverlay.less';

const OFFSET = { right: 0 };

export function UpdateAvailableOverlay(props) {
  return (
    <Overlay id="update-available-overlay"
      anchor={ props.anchor }
      onClose={ props.onClose }
      offset={ OFFSET }>
      <UpdateAvailableSection
        version={ props.version }
        openVersionInfoPage={ props.openVersionInfoPage }
        onGoToDownloadPage={ props.onGoToDownloadPage } />
    </Overlay>
  );
}

function UpdateAvailableSection({ version, openVersionInfoPage, onGoToDownloadPage }) {
  return (
    <div className={ css.UpdateAvailableOverlay }>
      <Section maxHeight="500px">
        <Section.Header>
          Update available
        </Section.Header>
        <Section.Body>
          <p>Camunda Desktop Modeler {version} is available for use.</p>
          <a className="links" onClick={ onGoToDownloadPage }>Update now</a>
          <a className="links" onClick={ openVersionInfoPage }>Learn what&apos;s new</a>
        </Section.Body>
      </Section>
    </div>
  );
}