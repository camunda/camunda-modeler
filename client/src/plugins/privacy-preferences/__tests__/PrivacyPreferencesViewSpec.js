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

import { render, fireEvent, screen } from '@testing-library/react';

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

describe('<PrivacyPreferencesView>', function() {

  describe('rendering', function() {

    it('should render', function() {
      render(<PrivacyPreferencesView />);
    });


    it('should render privacy text field', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      expect(screen.getByText(PRIVACY_TEXT_FIELD)).to.exist;
    });


    it('should render privacy policy url', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      const privacyPolicyLink = screen.getByRole('link', { name: PRIVACY_POLICY_TEXT });
      expect(privacyPolicyLink).to.exist;
      expect(privacyPolicyLink.getAttribute('href')).to.be.eql(PRIVACY_POLICY_URL);
    });


    it('should render title', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      expect(screen.getByText(TITLE)).to.exist;
    });


    it('should render OK button', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      expect(screen.getByRole('button', { name: OK_BUTTON_TEXT })).to.exist;
    });


    it('should not render cancel button if prop not set', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      expect(screen.queryByRole('button', { name: /Cancel/i })).to.not.exist;
    });


    it('should render cancel button if prop is set', function() {

      // when
      render(<PrivacyPreferencesView canCloseWithoutSave />);

      // then
      expect(screen.getByRole('button', { name: /Cancel/i })).to.exist;
      expect(screen.getByRole('button', { name: OK_BUTTON_TEXT })).to.exist;
    });


    it('should render privacy policy more info field', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      expect(screen.getByText(LEARN_MORE_TEXT, { exact: false })).to.exist;
      expect(screen.getByText(PRIVACY_POLICY_TEXT)).to.exist;
    });


    it('should render privacy settings', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      PREFERENCES_LIST.forEach(preference => {
        expect(screen.getByLabelText(new RegExp(preference.title, 'i'))).to.exist;
        expect(screen.getByText(new RegExp(preference.explanation, 'i'))).to.exist;
      });
    });
  });


  describe('functionality', function() {

    it('should default to true (opt-out) if preferences unset', function() {

      // when
      render(<PrivacyPreferencesView />);

      // then
      PREFERENCES_LIST.forEach(preference => {
        const checkbox = screen.getByLabelText(new RegExp(preference.title, 'i'));
        expect(checkbox.checked).to.be.true;
      });
    });


    it('should use unchecked for existing empty preferences', function() {

      // when
      render(<PrivacyPreferencesView preferences={ {} } />);

      // then
      PREFERENCES_LIST.forEach(preference => {
        const checkbox = screen.getByLabelText(new RegExp(preference.title, 'i'));
        expect(checkbox.checked).to.be.false;
      });
    });


    it('should load privacy preferences', function() {

      // given
      const privacyPreferences = {
        ENABLE_CRASH_REPORTS: false,
        ENABLE_USAGE_STATISTICS: true,
        ENABLE_UPDATE_CHECKS: false
      };

      // when
      render(<PrivacyPreferencesView preferences={ privacyPreferences } />);

      // then
      expect(screen.getByLabelText(/Enable Error Reports/i).checked).to.be.false;
      expect(screen.getByLabelText(/Enable Usage Statistics/i).checked).to.be.true;
      expect(screen.getByLabelText(/Enable Update Checks/i).checked).to.be.false;
    });


    it('should set autofocus if specified', async function() {

      // given
      const preferenceKey = PREFERENCES_LIST[2].key;

      // when
      render(<PrivacyPreferencesView autoFocusKey={ preferenceKey } />);

      // then
      const checkbox = screen.getByLabelText(new RegExp(PREFERENCES_LIST[2].title, 'i'));
      expect(checkbox === document.activeElement).to.be.true;
    });


    it('should save privacy preferences on save click', function() {

      // given
      let currentPreferences = {
        ENABLE_CRASH_REPORTS: true,
        ENABLE_USAGE_STATISTICS: true,
        ENABLE_UPDATE_CHECKS: true
      };

      const onSaveAndClose = spy();

      render(
        <PrivacyPreferencesView preferences={ currentPreferences } onSaveAndClose={ onSaveAndClose } />
      );

      // when
      fireEvent.click(screen.getByRole('button', { name: OK_BUTTON_TEXT }));

      // then
      expect(onSaveAndClose).to.have.been.calledWith(currentPreferences);
    });


    it('should not save privacy preferences on cancel click', function() {

      // given
      const onSaveAndClose = spy();

      render(
        <PrivacyPreferencesView
          preferences={ {} }
          canCloseWithoutSave
          onClose={ () => {} }
          onSaveAndClose={ onSaveAndClose } />
      );

      // when
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

      // then
      expect(onSaveAndClose).to.not.have.been.called;
    });


    it('should not have close icon', function() {

      // when
      const { container } = render(<PrivacyPreferencesView />);

      // then
      const closeIcon = container.querySelector('.close');
      expect(closeIcon).to.be.null;
    });
  });
});
