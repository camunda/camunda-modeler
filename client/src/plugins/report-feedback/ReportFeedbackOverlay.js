/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { Fragment } from 'react';

import { Overlay } from '../../shared/ui';

import { ReportFeedbackSystemInfo } from './ReportFeedbackSystemInfo';

import css from './ReportFeedbackOverlay.less';

const REPORT_ISSUE_LINK = 'https://github.com/camunda/camunda-modeler/issues/new/choose';
const USER_FORUM_LINK = 'https://forum.camunda.org/c/modeler/6';

const OFFSET = { right: 0 };


export function ReportFeedbackOverlay(props) {
  return (
    <Overlay
      anchor={ props.anchor }
      onClose={ props.onClose }
      offset={ OFFSET }
      className={ css.ReportFeedbackOverlay }
    >
      <ReportFeedbackChannels
        onClose={ props.onClose }
      />
      <ReportFeedbackSystemInfo
        onSubmit={ props.onSubmit }
      />
    </Overlay>
  );
}

function ReportFeedbackChannels(props) {
  return (
    <Fragment>
      <Overlay.Title>
        Your feedback is welcome
      </Overlay.Title>
      <Overlay.Body>
        <ReportFeedbackChannelsContent
          onClose={ props.onClose }
        />
      </Overlay.Body>
    </Fragment>
  );
}

function ReportFeedbackChannelsContent(props) {
  return (
    <Fragment>
      <p>
        Have you found an issue or would like to send a feature request?<br />
        <a onClick={ props.onClose } href={ REPORT_ISSUE_LINK }>Report an issue on GitHub</a>
      </p>
      <p>
        Would you like to discuss with other users?<br />
        <a onClick={ props.onClose } href={ USER_FORUM_LINK }>Visit the User Forum</a>
      </p>
    </Fragment>
  );
}
