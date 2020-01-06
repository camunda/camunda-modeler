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
  INFO_TEXT,
  RELEASE_NOTES_TITLE,
  BUTTON_NEGATIVE,
  BUTTON_POSITIVE
} from '../constants';

import NewVersionInfoView from '../NewVersionInfoView';

/* global sinon */
const { spy } = sinon;

describe('<NewVersionInfoView>', () => {

  let wrapper;

  beforeEach(() => {

    wrapper = mount(<NewVersionInfoView latestVersionInfo={ {
      latestVersion: 'v3.7.0',
      releases: [{
        version: 'v3.5.0',
        releaseNoteHTML: 'HTML 1'
      }, {
        version: 'v3.6.0',
        releaseNoteHTML: 'HTML 2'
      }]
    } } currentVersion={ 'v3.4.0' } />);
  });


  it('should render', () => {

    shallow(<NewVersionInfoView latestVersionInfo={ {} } />);
  });


  it('should render title', () => {

    const title = wrapper.find('.modal-title');

    expect(title.text()).to.be.eql(MODAL_TITLE);
  });


  it('should render info text', () => {

    const expectedText = INFO_TEXT.replace('@@1', 'v3.7.0').replace('@@2', 'v3.4.0');

    const infoText = wrapper.find('.newVersionInfoText');

    expect(infoText.text()).to.be.eql(expectedText);
  });


  it('should render release notes title', () => {

    const releaseNotesTitle = wrapper.find('.releaseNotesTitle');

    expect(releaseNotesTitle.text().trim()).to.be.eql(RELEASE_NOTES_TITLE);
  });


  it('should render positive button', () => {

    const positiveButton = wrapper.find('.btn-primary');

    expect(positiveButton.text().trim()).to.be.eql(BUTTON_POSITIVE);
  });


  it('should render negative button', () => {

    const negativeButton = wrapper.find('.btn').at(1);

    expect(negativeButton.text().trim()).to.be.eql(BUTTON_NEGATIVE);
  });


  it('should close', () => {

    const onCloseSpy = spy();

    const component = shallow(
      <NewVersionInfoView latestVersionInfo={ {} } onClose={ onCloseSpy } />
    );

    const negativeButton = component.find('.btn').at(1);

    negativeButton.simulate('click');

    expect(onCloseSpy).to.have.been.called;
  });


  it('should go to download page', () => {

    const onGoToDownloadPageSpy = spy();

    const component = shallow(
      <NewVersionInfoView latestVersionInfo={ {} } onGoToDownloadPage={ onGoToDownloadPageSpy } />
    );

    const positiveButton = component.find('.btn-primary');

    positiveButton.simulate('click');

    expect(onGoToDownloadPageSpy).to.have.been.called;
  });


  it('should render HTML snippets', () => {

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
