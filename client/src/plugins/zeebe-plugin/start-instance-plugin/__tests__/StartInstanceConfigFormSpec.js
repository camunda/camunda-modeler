/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';

import React from 'react';

import { render, fireEvent, act } from '@testing-library/react';

import { merge } from 'min-dash';

import StartInstanceConfigForm from '../StartInstanceConfigForm';

import { TextInput } from '../../../../shared/ui';

describe('<StartInstanceConfigForm>', function() {

  it('should render', function() {

    // when
    const { container } = createStartInstanceConfigForm();

    // then
    expect(container.innerHTML).to.not.be.empty;
  });


  it('should render no header by default', function() {

    // when
    const { container } = createStartInstanceConfigForm();

    // then
    expect(container.querySelector('.section__header')).to.be.null;
  });


  it('should render custom header', function() {

    // given
    const renderHeader = 'Custom Header';

    // when
    const { container } = createStartInstanceConfigForm({
      renderHeader
    });

    // then
    expect(container.querySelector('.section__header')).to.not.be.null;
  });


  it('should render default submit button', function() {

    // when
    const { container } = createStartInstanceConfigForm();

    // then
    expect(container.querySelector('button[type="submit"]').textContent).to.eql('Submit');
  });


  it('should render custom submit button', function() {

    // given
    const renderSubmit = 'Custom Submit';

    // when
    const { container } = createStartInstanceConfigForm({
      renderSubmit
    });

    // then
    expect(container.querySelector('button[type="submit"]').textContent).to.eql(renderSubmit);
  });


  describe('fields', function() {

    describe('variables', function() {

      it('should render', function() {

        // when
        const { container } = createStartInstanceConfigForm();

        // then
        expect(container.querySelector('label[for="variables"]')).to.not.be.null;
      });

    });

  });


  describe('submission', function() {

    it('should submit', async function() {

      // given
      const onSubmitSpy = sinon.spy();

      const { container } = createStartInstanceConfigForm({
        onSubmit: onSubmitSpy
      });

      // when
      await act(async () => {
        fireEvent.change(container.querySelector('textarea[name="variables"]'), {
          target: { name: 'variables', value: '{ "foo": "bar" }' }
        });
      });

      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });

      // then
      expect(onSubmitSpy).to.have.been.calledOnce;
      expect(onSubmitSpy).to.have.been.calledWith(merge({}, DEFAULT_INITIAL_FIELD_VALUES, {
        variables: '{ "foo": "bar" }'
      }));
    });


    it('should be disabled when submitting', async function() {

      // given
      const onSubmitSpy = sinon.spy((_, props) => {

        // then
        expect(props.isSubmitting).to.be.true;
        expect(container.querySelector('button[type="submit"]').disabled).to.be.true;

        return Promise.resolve();
      });

      const { container } = createStartInstanceConfigForm({
        onSubmit: onSubmitSpy
      });

      // when
      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });

      // then
      expect(onSubmitSpy).to.have.been.calledOnce;
    });

  });


  describe('validation', function() {

    it('should validate form and fields on mount', async function() {

      // given
      const validateFieldSpy = sinon.spy(),
            validateFormSpy = sinon.spy();

      createStartInstanceConfigForm({
        validateField: validateFieldSpy,
        validateForm: validateFormSpy
      });

      // then
      expect(validateFieldSpy.callCount).to.eql(1);

      expect(validateFieldSpy).to.have.been.calledWith('variables', '{}');

      expect(validateFormSpy).to.have.been.calledOnce;

      expect(validateFormSpy).to.have.been.calledWith({
        variables: '{}'
      });
    });


    it('should validate form on submit', async function() {

      // given
      const validateFieldSpy = sinon.spy(),
            validateFormSpy = sinon.spy();

      const { container } = createStartInstanceConfigForm({
        validateField: validateFieldSpy,
        validateForm: validateFormSpy
      });

      // then
      expect(validateFormSpy).to.have.been.calledWith({
        variables: '{}'
      });

      // when
      validateFieldSpy.resetHistory();
      validateFormSpy.resetHistory();

      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });

      // then
      expect(validateFieldSpy.callCount).to.eql(1);
      expect(validateFormSpy.callCount).to.eql(1);
    });


    it('should validate form on blur', async function() {

      // given
      const validateFieldSpy = sinon.spy(),
            validateFormSpy = sinon.spy();

      const { container } = createStartInstanceConfigForm({
        validateField: validateFieldSpy,
        validateForm: validateFormSpy
      });

      // then
      expect(validateFormSpy).to.have.been.calledWith({
        variables: '{}'
      });

      // when
      validateFieldSpy.resetHistory();
      validateFormSpy.resetHistory();

      await act(async () => {
        fireEvent.blur(container.querySelector('textarea[name="variables"]'), {
          target: { name: 'variables', value: '{ "foo": "bar" }' }
        });
      });

      // then
      expect(validateFieldSpy.callCount).to.eql(1);
      expect(validateFormSpy.callCount).to.eql(1);
    });


    it('should validate field value on change', async function() {

      // given
      const validateFieldSpy = sinon.spy();

      const { container } = createStartInstanceConfigForm({
        validateField: validateFieldSpy
      });

      // when
      await act(async () => {
        fireEvent.change(container.querySelector('textarea[name="variables"]'), {
          target: { name: 'variables', value: '{ "foo": "bar" }' }
        });
      });

      // then
      expect(validateFieldSpy).to.have.been.calledWith('variables', '{ "foo": "bar" }');
    });


    it('should add field error (getFieldError)', async function() {

      // given
      const { container } = createStartInstanceConfigForm({
        getFieldError: (fieldName) => {
          return fieldName === 'variables' ? 'Error' : undefined;
        }
      });

      // then
      expect(container.querySelector('.invalid-feedback').textContent).to.eql('Error');
    });


    it('should add field error (meta.error)', async function() {

      // given
      const { container } = createStartInstanceConfigForm({
        validateField: (name, value) => name === 'variables' && value === '{' ? 'Error' : undefined
      });

      // when
      await act(async () => {
        fireEvent.change(container.querySelector('textarea[name="variables"]'), {
          target: { name: 'variables', value: '{' }
        });
      });

      await act(async () => {
        fireEvent.blur(container.querySelector('textarea[name="variables"]'));
      });

      // then
      expect(container.querySelector('.invalid-feedback').textContent).to.eql('Error');
    });


    it('should remove field error (getFieldError)', async function() {

      // given
      let error = 'Error';

      const getFieldError = (meta, fieldName) => fieldName === 'variables' ? error : undefined;

      const { container } = createStartInstanceConfigForm({
        getFieldError,
        initialFieldValues: {
          endpoint: {
            camundaCloudClientId: 'foo'
          }
        }
      });

      // when
      error = undefined;

      await act(async () => {
        fireEvent.change(container.querySelector('textarea[name="variables"]'), {
          target: { name: 'variables', value: 'bar' }
        });
      });

      // then
      expect(container.querySelector('.invalid-feedback')).to.be.null;
    });


    it('should remove field error (meta.error)', async function() {

      // given
      const { container } = createStartInstanceConfigForm({
        validateField: (name, value) => name === 'variables' && value === 'foo' ? 'Error' : undefined
      });

      await act(async () => {
        fireEvent.change(container.querySelector('textarea[name="variables"]'), {
          target: { name: 'variables', value: 'foo' }
        });
      });

      await act(async () => {
        fireEvent.blur(container.querySelector('textarea[name="variables"]'));
      });

      // when
      await act(async () => {
        fireEvent.change(container.querySelector('textarea[name="variables"]'), {
          target: { name: 'variables', value: 'bar' }
        });
      });

      await act(async () => {
        fireEvent.blur(container.querySelector('textarea[name="variables"]'));
      });


      expect(container.querySelector('.invalid-feedback')).to.be.null;
    });

  });


  describe('lint errors', function() {

    it('should show lint error feedback', function() {

      // when
      const { container } = createStartInstanceConfigForm({
        hasLintErrors: true
      });

      // then
      const feedbacks = container.querySelectorAll('.invalid-feedback');
      const lintFeedback = Array.from(feedbacks).find(el => el.textContent.includes('linting errors'));
      expect(lintFeedback).to.exist;
    });


    it('should not show lint error feedback if no lint errors', function() {

      // when
      const { container } = createStartInstanceConfigForm({
        hasLintErrors: false
      });

      // then
      const feedbacks = container.querySelectorAll('.invalid-feedback');
      const lintFeedback = Array.from(feedbacks).find(el => el.textContent.includes('linting errors'));
      expect(lintFeedback).to.not.exist;
    });


    it('should not show lint error feedback if connection check failed', function() {

      // when
      const { container } = createStartInstanceConfigForm({
        hasLintErrors: true,
        connectionCheckResult: { success: false, reason: 'CONTACT_POINT_UNAVAILABLE' }
      });

      // then
      const feedbacks = container.querySelectorAll('.invalid-feedback');
      const lintFeedback = Array.from(feedbacks).find(el => el.textContent.includes('linting errors'));
      expect(lintFeedback).to.not.exist;

      const connectionFeedback = Array.from(feedbacks).find(el => el.textContent.includes('Could not establish connection'));
      expect(connectionFeedback).to.exist;
    });


    it('should open linting panel on click', function() {

      // given
      const handleOpenLintingPanelSpy = sinon.spy();

      const { container } = createStartInstanceConfigForm({
        hasLintErrors: true,
        handleOpenLintingPanel: handleOpenLintingPanelSpy
      });

      // when
      const feedbacks = container.querySelectorAll('.invalid-feedback');
      const lintFeedback = Array.from(feedbacks).find(el => el.textContent.includes('linting errors'));
      fireEvent.click(lintFeedback.querySelector('a'));

      // then
      expect(handleOpenLintingPanelSpy).to.have.been.calledOnce;
    });

  });

});

const DEFAULT_INITIAL_FIELD_VALUES = {
  variables: '{}'
};

function createStartInstanceConfigForm(props = {}) {
  let {
    connectionCheckResult,
    getFieldError = (meta, fieldName) => {},
    handleChangeConnections = () => {},
    handleManageConnections = () => {},
    handleOpenLintingPanel = () => {},
    hasLintErrors = false,
    initialFieldValues = {},
    onSubmit = () => {},
    renderHeader = null,
    renderSubmit = 'Submit',
    validateField = () => {},
    validateForm = () => {},
    VariablesComponent = TextInput,
    variablesComponentProps = {
      multiline: true
    }
  } = props;

  initialFieldValues = merge({}, DEFAULT_INITIAL_FIELD_VALUES, initialFieldValues);

  return render(<StartInstanceConfigForm
    connectionCheckResult={ connectionCheckResult }
    getFieldError={ getFieldError }
    handleChangeConnections={ handleChangeConnections }
    handleManageConnections={ handleManageConnections }
    handleOpenLintingPanel={ handleOpenLintingPanel }
    hasLintErrors={ hasLintErrors }
    initialFieldValues={ initialFieldValues }
    onSubmit={ onSubmit }
    renderHeader={ renderHeader }
    renderSubmit={ renderSubmit }
    validateField={ validateField }
    validateForm={ validateForm }
    VariablesComponent={ VariablesComponent }
    variablesComponentProps={ variablesComponentProps } />);
}