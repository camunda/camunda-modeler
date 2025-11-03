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

import { ReleaseInfo } from './ReleaseInfo';
import { utmTag } from '../../util/utmTag';


const RELEASE_NOTES_LINK = utmTag('https://camunda.com/blog/category/releases/');
const DOCS_LINK = utmTag('https://docs.camunda.io/docs/components/modeler/desktop-modeler/');
const CHANGELOG_LINK = 'https://github.com/camunda/camunda-modeler/blob/main/CHANGELOG.md';

const OFFSET = { right: 0 };

export function VersionInfoOverlay(props) {
  return (
    <Overlay
      id="version-info-overlay" anchor={ props.anchor } onClose={ props.onClose } offset={ OFFSET }
    >
      <WhatsNewSection version={ props.version } />

      <LearnMoreSection />
    </Overlay>
  );
}

function WhatsNewSection(props) {

  return (
    <Section maxHeight="500px">
      <Section.Header>
        What&apos;s new in Modeler { props.version }
      </Section.Header>
      <Section.Body>
        <ReleaseInfo />
      </Section.Body>
    </Section>
  );
}

function LearnMoreSection(props) {
  return (
    <Section>
      <Section.Header>
        Learn More
      </Section.Header>
      <Section.Body>
        <ul className="dashed">
          <li><a href={ RELEASE_NOTES_LINK }>Release Notes on Camunda blog</a></li>
          <li><a href={ DOCS_LINK }>Camunda Modeler docs</a></li>
          <li><a href={ CHANGELOG_LINK }>Changelog on GitHub</a></li>
        </ul>
      </Section.Body>
    </Section>
  );
}
