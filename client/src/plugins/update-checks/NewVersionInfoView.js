/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import { Button, Heading } from '@camunda/design-system';

import {
  Modal
} from '../../shared/ui';

import PrivacyPreferencesLink from './PrivacyPreferencesLink';

import {
  MODAL_TITLE,
  BUTTON_NEGATIVE,
  BUTTON_POSITIVE,
  RELEASE_NOTES_TITLE,
  INFO_TEXT,
  INFO_TEXT2
} from './constants';

import * as css from './NewVersionInfoView.css';

class NewVersionInfoView extends PureComponent {
  renderHtmlSnippets(releases) {
    if (!releases) {
      return null;
    }
    return releases.map((release) => {
      const {
        version,
        releaseNoteHTML
      } = release;

      return (
        <div
          className="htmlSnippetItem"
          key={ version }>
          <Heading as="h4" variant="heading-xs">{ version }</Heading>
          <div dangerouslySetInnerHTML={ { __html: releaseNoteHTML } } />
        </div>
      );
    });
  }

  render() {
    const {
      latestVersionInfo,
      currentVersion,
      onClose,
      onOpenDownloadUrl,
      onOpenPrivacyPreferences,
      updateChecksEnabled
    } = this.props;

    const {
      latestVersion,
      releases
    } = latestVersionInfo;

    const infoTextProcessed = INFO_TEXT.replace('@@1', latestVersion).replace('@@2', currentVersion);

    return (
      <Modal className={ css.NewVersionInfo } onClose={ onClose }>

        <Modal.Title>{ MODAL_TITLE }</Modal.Title>

        <Modal.Body>
          <p>
            { infoTextProcessed }
          </p>
          <p>
            { INFO_TEXT2 }
          </p>
          <div className="releaseNotesContainer">
            <Heading as="h4" variant="heading-xs">{ RELEASE_NOTES_TITLE }</Heading>
            <div className="htmlSnippet">
              { this.renderHtmlSnippets(releases) }
            </div>
          </div>
          <PrivacyPreferencesLink
            onOpenPrivacyPreferences={ onOpenPrivacyPreferences }
            updateChecksEnabled={ updateChecksEnabled }
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={ onClose }>{ BUTTON_NEGATIVE }</Button>
          <Button onClick={ onOpenDownloadUrl } autoFocus>{ BUTTON_POSITIVE }</Button>
        </Modal.Footer>

      </Modal>
    );
  }
}

export default NewVersionInfoView;
