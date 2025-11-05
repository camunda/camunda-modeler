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

import { ReportFeedbackSystemInfoSection } from './ReportFeedbackSystemInfoSection';

import * as css from './ReportFeedbackOverlay.less';
import { utmTag } from '../../util/utmTag';


const REPORT_ISSUE_LINK = 'https://github.com/camunda/camunda-modeler/issues/new/choose';
const USER_FORUM_LINK = utmTag('https://forum.camunda.io/c/bpmn-modeling/');

const OFFSET = { right: 0 };


export function ReportFeedbackOverlay(props) {
  return (
    <Overlay
      anchor={ props.anchor }
      onClose={ props.onClose }
      offset={ OFFSET }
      className={ css.ReportFeedbackOverlay }
    >
      <ReportFeedbackChannelsSection
        onClose={ props.onClose }
      />

      <ReportFeedbackSystemInfoSection
        onSubmit={ props.onSubmit }
      />
    </Overlay>
  );
}

function ReportFeedbackChannelsSection(props) {

  const {
    onClose
  } = props;

  return (
    <Section>
      <Section.Header>
        Share your feedback
      </Section.Header>
      <Section.Body>
        <p>
          <a onClick={ onClose } href={ USER_FORUM_LINK }>Visit our user forum</a> to share general feedback on the Modeler.
        </p>
        <p>
          <a onClick={ onClose } href={ REPORT_ISSUE_LINK }>Open an issue on GitHub</a> to report a bug or request a new feature.
        </p>
      </Section.Body>
    </Section>
  );
}
