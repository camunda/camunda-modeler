/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';

import {
  MODAL_TITLE,
  BUTTON_NEGATIVE,
  BUTTON_POSITIVE
} from '../constants';

import NewVersionInfoView from '../NewVersionInfoView';

const { spy } = sinon;

describe('<NewVersionInfoView>', function() {

  function createNewVersionInfoView(options = {}) {
    const {
      latestVersionInfo = {
        latestVersion: 'v3.7.0',
        releases: [ {
          version: 'v3.5.0',
          releaseNoteHTML: 'HTML 1'
        }, {
          version: 'v3.6.0',
          releaseNoteHTML: 'HTML 2'
        } ]
      },
      currentVersion = 'v3.4.0',
      ...props
    } = options;

    return render(
      <NewVersionInfoView
        latestVersionInfo={ latestVersionInfo }
        currentVersion={ currentVersion }
        { ...props }
      />
    );
  }

  it('should render', function() {
    createNewVersionInfoView({ latestVersionInfo: {} });
  });


  it('should render title', function() {

    // when
    createNewVersionInfoView();

    // then
    expect(screen.getByText(MODAL_TITLE)).to.exist;
  });


  it('should render body', function() {

    // given
    const expectedFragments = [
      'Camunda Modeler v3.7.0 is available. Your version is v3.4.0.',
      'Would you like to download it now?',
      'Release notes',
      'v3.5.0',
      'HTML 1',
      'v3.6.0',
      'HTML 2',
      'Periodic update checks are currently',
      'disabled',
      'Enable them in the',
      'Privacy Preferences'
    ];

    // when
    createNewVersionInfoView();

    // then
    for (const expectedText of expectedFragments) {
      expect(screen.getByText(expectedText, { exact: false })).to.exist;
    }
  });


  describe('footer', function() {

    it('should render <Download> button', function() {

      // when
      createNewVersionInfoView();

      // then
      const downloadButton = screen.getByRole('button', { name: BUTTON_POSITIVE });
      expect(downloadButton).to.exist;

      // and auto-focussed
      expect(downloadButton).to.eql(document.activeElement);
    });


    it('should render <Skip> button', function() {

      // when
      createNewVersionInfoView();

      // then
      const skipButton = screen.getByRole('button', { name: BUTTON_NEGATIVE });
      expect(skipButton).to.exist;
    });

  });


  it('should close', function() {

    // given
    const onCloseSpy = spy();

    // when
    createNewVersionInfoView({ latestVersionInfo: {}, onClose: onCloseSpy });

    const negativeButton = screen.getByRole('button', { name: BUTTON_NEGATIVE });
    fireEvent.click(negativeButton);

    // then
    expect(onCloseSpy).to.have.been.called;
  });


  it('should go to download page', function() {

    // given
    const onOpenDownloadUrlSpy = spy();

    // when
    createNewVersionInfoView({ latestVersionInfo: {}, onOpenDownloadUrl: onOpenDownloadUrlSpy });

    const positiveButton = screen.getByRole('button', { name: BUTTON_POSITIVE });
    fireEvent.click(positiveButton);

    // then
    expect(onOpenDownloadUrlSpy).to.have.been.called;
  });


  it('should render HTML snippets', function() {

    // when
    createNewVersionInfoView({
      latestVersionInfo: {
        latestVersion: 'v3.7.0',
        releases: [
          {
            version: 'v3.1.0',
            releaseNoteHTML: '<b> HTML 1 </b>'
          }, {
            version: 'v3.2.0',
            releaseNoteHTML: '<b> HTML 2 </b>'
          }
        ]
      }
    });

    // then
    expect(screen.getByText('v3.1.0')).to.exist;
    expect(screen.getByText('v3.2.0')).to.exist;
    expect(screen.getByText('HTML 1')).to.exist;
    expect(screen.getByText('HTML 2')).to.exist;

    // verify HTML is actually rendered with bold tags
    const htmlSnippet = document.querySelector('.htmlSnippet');
    expect(htmlSnippet).to.exist;
    expect(htmlSnippet.innerHTML).to.contain('<b> HTML 1 </b>');
    expect(htmlSnippet.innerHTML).to.contain('<b> HTML 2 </b>');
  });
});
