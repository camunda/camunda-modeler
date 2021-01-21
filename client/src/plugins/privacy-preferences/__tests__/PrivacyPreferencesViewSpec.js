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

import PrivacyPreferencesView from '../PrivacyPreferencesView';

import {
  PRIVACY_TEXT_FIELD,
  PRIVACY_POLICY_URL,
  LEARN_MORE_TEXT,
  PRIVACY_POLICY_TEXT,
  PREFERENCES_LIST,
  OK_BUTTON_TEXT,
  TITLE
} from '../constants';

/* global sinon */
const { spy } = sinon;

const PRIVACY_PREFERENCES_SELECTOR = '.privacyPreferencesField';

describe('<PrivacyPreferencesView>', function() {

  describe('rendering', function() {

    let wrapper;

    beforeEach(function() {

      wrapper = mount(<PrivacyPreferencesView />);
    });


    it('should render', function() {

      shallow(<PrivacyPreferencesView />);
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

      const cancel = wrapper.find('.btn').at(1);

      expect(cancel).to.have.lengthOf(0);
    });


    it('should render cancel button if prop is set', function() {

      wrapper = mount(<PrivacyPreferencesView canCloseWithoutSave />);

      const cancel = wrapper.find('.btn').at(1);

      expect(cancel).to.have.lengthOf(1);
    });


    it('should render privacy policy more info field', function() {

      const privacyPolicyMoreInfoField = wrapper.find('.privacyMoreInfoField').find('p');

      expect(privacyPolicyMoreInfoField.text()).to.be.eql(LEARN_MORE_TEXT + PRIVACY_POLICY_TEXT);
    });


    it('should render privacy settings', function() {

      const privacyPreferences = wrapper.find(PRIVACY_PREFERENCES_SELECTOR);

      expect(privacyPreferences.find('input')).to.have.lengthOf(PREFERENCES_LIST.length);

      PREFERENCES_LIST.forEach(preference => {

        const labelWrapper = privacyPreferences.findWhere(
          wrapper => wrapper.prop('htmlFor') === preference.key
        );

        const label = labelWrapper.find('.checkboxLabel').text().trim();
        const explanation = labelWrapper.find('.checkboxExplanation').text().trim();

        expect(label).to.be.eql(preference.title);
        expect(explanation).to.be.eql(preference.explanation);
      });
    });
  });


  describe('functionality', function() {

    it('should use default values if preferences empty', function() {

      // when
      const wrapper = mount(<PrivacyPreferencesView />);

      const checkboxes = wrapper.find(PRIVACY_PREFERENCES_SELECTOR).find('input');

      // then
      checkboxes.forEach(function(checkbox, index) {
        expect(checkbox.props().defaultChecked).to.be.eql(false);
      });
    });


    it('should load privacy preferences', function() {

      // given
      const values = [false, true, false];

      const privacyPreferences = {
        ENABLE_CRASH_REPORTS: values[0],
        ENABLE_USAGE_STATISTICS: values[1],
        ENABLE_UPDATE_CHECKS: values[2]
      };

      // when
      const wrapper = mount(
        <PrivacyPreferencesView preferences={ privacyPreferences } />
      );

      const checkboxes = wrapper.find(PRIVACY_PREFERENCES_SELECTOR).find('input');

      // then
      checkboxes.forEach(function(checkbox, index) {
        expect(checkbox.props().defaultChecked).to.be.eql(values[index]);
      });
    });

    it('should not set autofocus', async () => {

      // given
      const preferenceKey = PREFERENCES_LIST[2].key;

      // when
      const wrapper = mount(<PrivacyPreferencesView />);

      // then
      expect(wrapper.find(`#${preferenceKey}`).is(':focus')).to.be.false;
    });



    it('should set autofocus if specified', async () => {

      // given
      const preferenceKey = PREFERENCES_LIST[2].key;

      // when
      const wrapper = mount(
        <PrivacyPreferencesView autoFocusKey={ preferenceKey } />
      );

      // then
      expect(wrapper.find(`#${preferenceKey}`).is(':focus')).to.be.true;
    });


    it('should save privacy preferences on save click', function() {

      let currentPreferences = {
        ENABLE_CRASH_REPORTS: true,
        ENABLE_USAGE_STATISTICS: true,
        ENABLE_UPDATE_CHECKS: true
      };

      const onSaveAndClose = spy();

      const wrapper = mount(
        <PrivacyPreferencesView preferences={ currentPreferences } onSaveAndClose={ onSaveAndClose } />
      );

      const saveButton = wrapper.find('.btn-primary').first();
      saveButton.simulate('click');
      expect(onSaveAndClose).to.have.been.calledWith(currentPreferences);
    });


    it('should not save privacy preferences on cancel click', function() {

      const onSaveAndClose = spy();

      const wrapper = mount(
        <PrivacyPreferencesView
          preferences={ {} }
          canCloseWithoutSave
          onClose={ () => {} }
          onSaveAndClose={ onSaveAndClose } />
      );

      const cancelButton = wrapper.find('.btn-secondary');
      cancelButton.simulate('click');
      expect(onSaveAndClose).to.not.have.been.called;
    });


    it('should not have close icon', function() {

      const wrapper = mount(<PrivacyPreferencesView />);
      const closeIcon = wrapper.find('.close');

      expect(closeIcon).to.have.lengthOf(0);
    });
  });
});
