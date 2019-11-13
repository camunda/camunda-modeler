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

import { PrivacyPreferencesModal } from '..';

import {
  PRIVACY_TEXT_FIELD,
  PRIVACY_POLICY_URL,
  LEARN_MORE_TEXT,
  PRIVACY_POLICY_TEXT,
  PREFERENCES_LIST,
  OK_BUTTON_TEXT,
  TITLE
} from '../constants';

// eslint-disable-next-line no-undef
const { spy } = sinon;

describe('<PrivacyPreferencesModal>', function() {

  describe('rendering', function() {

    let wrapper;

    beforeEach(function() {

      wrapper = mount(<PrivacyPreferencesModal />);
    });


    it('should render', function() {

      shallow(<PrivacyPreferencesModal />);
    });


    it('should render privacy text field', function() {

      const privacyText = wrapper.find('.privacyTextField').text();

      expect(privacyText).to.be.eql(PRIVACY_TEXT_FIELD);
    });


    it('should render privacy policy url', function() {

      const privacyMoreInfoURLField = wrapper.find('.privacyMoreInfoField').find('a');

      expect(privacyMoreInfoURLField.prop('href')).to.be.eql(PRIVACY_POLICY_URL);
      expect(privacyMoreInfoURLField.text()).to.be.eql(PRIVACY_POLICY_TEXT);
    });


    it('should render title', function() {

      const title = wrapper.find('.modal-title');

      expect(title.text()).to.be.eql(TITLE);
    });


    it('should render OK button', function() {

      const button = wrapper.find('.form-submit').find('button');

      expect(button.text()).to.be.eql(OK_BUTTON_TEXT);
    });


    it('should not render cancel button if prop not set', function() {

      const cancel = wrapper.find('.privacyPreferencesCancel');

      expect(cancel).to.have.lengthOf(0);
    });


    it('should render cancel button is prop set', function() {

      wrapper = mount(<PrivacyPreferencesModal privacyPreferences={ {} } />);

      const cancel = wrapper.find('.privacyPreferencesCancel');

      expect(cancel).to.have.lengthOf(1);
    });


    it('should render privacy policy more info field', function() {

      const privacyPolicyMoreInfoField = wrapper.find('.privacyMoreInfoField').find('p');

      expect(privacyPolicyMoreInfoField.text()).to.be.eql(LEARN_MORE_TEXT + PRIVACY_POLICY_TEXT);
    });


    it('should render privacy settings', function() {

      const privacySettingsField = wrapper.find('.grid-container');

      expect(privacySettingsField).to.have.lengthOf(PREFERENCES_LIST.length);

      privacySettingsField.forEach((field, index) => {
        const label = field.find('.checkboxLabel').text().trim();
        const explanation = field.find('.checkboxExplanation').text().trim();

        expect(label).to.be.eql(PREFERENCES_LIST[index].title);
        expect(explanation).to.be.eql(PREFERENCES_LIST[index].explanation);
      });
    });
  });


  describe('functionality', function() {

    it('should use default values if preferences empty', function() {

      const wrapper = mount(<PrivacyPreferencesModal />);

      const checkboxes = wrapper.find('.grid-contrainer').find('input');

      checkboxes.forEach(function(checkbox, index) {

        expect(checkbox.props().defaultChecked).to.be.eql(true);
      });
    });


    it('should load privacy preferences', function() {

      const values = [false, true, false];

      const privacyPreferences = {
        ENABLE_CRASH_REPORTS: values[0],
        ENABLE_USAGE_STATISTICS: values[1],
        ENABLE_UPDATE_CHECKS: values[2]
      };

      const wrapper = mount(
        <PrivacyPreferencesModal privacyPreferences={ privacyPreferences } />
      );

      const checkboxes = wrapper.find('.grid-container').find('input');

      checkboxes.forEach(function(checkbox, index) {
        expect(checkbox.props().defaultChecked).to.be.eql(values[index]);
      });
    });


    it('should save privacy preferences on save click', function() {

      let currentPreferences = {
        ENABLE_CRASH_REPORTS: true,
        ENABLE_USAGE_STATISTICS: true,
        ENABLE_UPDATE_CHECKS: true
      };

      const setPrivacyPreferencesSpy = spy();

      const wrapper = mount(
        <PrivacyPreferencesModal onClose={ () => {} } setPrivacyPreferences={ setPrivacyPreferencesSpy } />
      );

      const saveButton = wrapper.find('.privacyPreferencesSave').first();
      saveButton.simulate('click');
      expect(setPrivacyPreferencesSpy).to.have.been.calledWith(currentPreferences);
    });


    it('should not save privacy preferences on cancel click', function() {

      const setPrivacyPreferencesSpy = spy();

      const wrapper = mount(
        <PrivacyPreferencesModal privacyPreferences={ {} }
          onClose={ () => {} }
          setPrivacyPreferences={ setPrivacyPreferencesSpy } />
      );

      const cancelButton = wrapper.find('.privacyPreferencesCancel').first();
      cancelButton.simulate('click');
      expect(setPrivacyPreferencesSpy).to.not.have.been.called;
    });


    it('should not have close icon', function() {

      const wrapper = mount(<PrivacyPreferencesModal />);
      const closeIcon = wrapper.find('.close');

      expect(closeIcon).to.have.lengthOf(0);
    });
  });
});
