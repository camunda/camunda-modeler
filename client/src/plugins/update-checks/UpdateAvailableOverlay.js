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

const OFFSET = { right: 0 };

export function UpdateAvailableOverlay(props) {
  console.log('updateAvailableOverlay');
  console.log(props);
  return (
    <Overlay
      id="update-available-overlay" anchor={ props.anchor } onClose={ props.onClose } offset={ OFFSET }
    >
      <UpdateAvailableSection version={ props.version } openVersionInfoPage={ props.openVersionInfoPage } />
    </Overlay>
  );
}

function UpdateAvailableSection({ version, openVersionInfoPage }) {

  return (
    <Section maxHeight="500px">
      <Section.Header>
        Upgrade available { version }
      </Section.Header>
      <Section.Body>
        <p>An update to Modeler {version} is available</p>
        <a onClick={ ()=> openVersionInfo(openVersionInfoPage) }>Learn what's new</a> {/* TODO: cursor */}
      </Section.Body>
    </Section>
  );
}

const openVersionInfo = (openVersionInfoPage) => {
  openVersionInfoPage();
};