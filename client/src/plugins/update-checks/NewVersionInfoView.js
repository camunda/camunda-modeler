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

import {
  Modal
} from '../../app/primitives';

import PrivacyPreferencesLink from './PrivacyPreferencesLink';

import {
  MODAL_TITLE,
  BUTTON_NEGATIVE,
  BUTTON_POSITIVE,
  RELEASE_NOTES_TITLE,
  INFO_TEXT,
  INFO_TEXT2
} from './constants';

import css from './NewVersionInfoView.less';

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

      return (<div
        className="htmlSnippetItem"
        key={ version }
        dangerouslySetInnerHTML={ { __html: releaseNoteHTML } }
      />);
    });
  }

  render() {
    const {
      latestVersionInfo,
      currentVersion,
      onClose,
      onGoToDownloadPage,
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
          <div className="newVersionInfoText">
            { infoTextProcessed }
          </div>
          <br />
          { INFO_TEXT2 }
          <div className="releaseNotesContainer">
            <b className="releaseNotesTitle"> { RELEASE_NOTES_TITLE } </b>
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
          <div className="formSubmit">
            <button className="btn btn-secondary" onClick={ onClose }> { BUTTON_NEGATIVE } </button>
            <button
              className="btn btn-primary"
              onClick={ onGoToDownloadPage }
              autoFocus
            > { BUTTON_POSITIVE } </button>
          </div>
        </Modal.Footer>

      </Modal>
    );
  }
}

export default NewVersionInfoView;
