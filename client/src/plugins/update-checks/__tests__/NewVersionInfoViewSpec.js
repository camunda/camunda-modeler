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

import {
  mount,
  shallow
} from 'enzyme';

import {
  MODAL_TITLE,
  BUTTON_NEGATIVE,
  BUTTON_POSITIVE
} from '../constants';

import NewVersionInfoView from '../NewVersionInfoView';

/* global sinon */
const { spy } = sinon;

describe('<NewVersionInfoView>', function() {

  let wrapper;

  beforeEach(function() {

    wrapper = mount(<NewVersionInfoView latestVersionInfo={ {
      latestVersion: 'v3.7.0',
      releases: [ {
        version: 'v3.5.0',
        releaseNoteHTML: 'HTML 1'
      }, {
        version: 'v3.6.0',
        releaseNoteHTML: 'HTML 2'
      } ]
    } } currentVersion={ 'v3.4.0' } />);
  });


  it('should render', function() {

    shallow(<NewVersionInfoView latestVersionInfo={ {} } />);
  });


  it('should render title', function() {

    const title = wrapper.find('.modal-title');

    expect(title.text()).to.be.eql(MODAL_TITLE);
  });


  it('should render body', function() {

    // given
    const expectedText = `
      Camunda Modeler v3.7.0 is available. Your version is v3.4.0.

      Would you like to download it now?

      Release notes

      v3.5.0
      HTML 1

      v3.6.0
      HTML 2

      Periodic update checks are currently disabled. Enable them in the  Privacy Preferences.
    `;

    const expectedFragments = expectedText.split('\n').map(l => l.trim()).filter(l => l);

    // when
    const body = wrapper.find('.modal-body');

    const text = body.text();

    // then
    for (const expectedText of expectedFragments) {
      expect(text, 'body text').to.include(expectedText);
    }
  });


  describe('footer', function() {

    it('should render <Download> button', function() {

      // given
      const footer = wrapper.find('.modal-footer');

      // when
      const downloadButton = footer.find('.btn-primary');

      // then
      expect(downloadButton.text().trim()).to.be.eql(BUTTON_POSITIVE);

      // and auto-focussed
      expect(downloadButton.instance()).to.eql(document.activeElement);
    });


    it('should render <Skip> button', function() {

      // given
      const footer = wrapper.find('.modal-footer');

      // when
      const skipButton = footer.find('.btn-secondary');

      // then
      expect(skipButton.text().trim()).to.be.eql(BUTTON_NEGATIVE);
    });

  });


  it('should close', function() {

    const onCloseSpy = spy();

    const component = shallow(
      <NewVersionInfoView latestVersionInfo={ {} } onClose={ onCloseSpy } />
    );

    const negativeButton = component.find('.btn-secondary');

    negativeButton.simulate('click');

    expect(onCloseSpy).to.have.been.called;
  });


  it('should go to download page', function() {

    const onOpenDownloadUrlSpy = spy();

    const component = shallow(
      <NewVersionInfoView latestVersionInfo={ {} } onOpenDownloadUrl={ onOpenDownloadUrlSpy } />
    );

    const positiveButton = component.find('.btn-primary');

    positiveButton.simulate('click');

    expect(onOpenDownloadUrlSpy).to.have.been.called;
  });


  it('should render HTML snippets', function() {

    const component = shallow(
      <NewVersionInfoView latestVersionInfo={ {
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
      } } />
    );

    const htmlSnippet = component.find('.htmlSnippet');

    expect(htmlSnippet.html()).to.contain('<b> HTML 1 </b>');
    expect(htmlSnippet.html()).to.contain('<b> HTML 2 </b>');
  });
});
