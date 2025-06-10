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

import { act } from 'react-dom/test-utils';

import { mount } from 'enzyme';

import { merge } from 'min-dash';

import StartInstanceConfigForm from '../StartInstanceConfigForm';

import { TextInput } from '../../../../shared/ui';

describe('<StartInstanceConfigForm>', function() {

  it('should render', function() {

    // when
    const wrapper = createStartInstanceConfigForm();

    // then
    expect(wrapper.exists()).to.be.true;
  });


  it('should render no header by default', function() {

    // when
    const wrapper = createStartInstanceConfigForm();

    // then
    expect(wrapper.find('.section__header').exists()).to.be.false;
  });


  it('should render custom header', function() {

    // given
    const renderHeader = 'Custom Header';

    // when
    const wrapper = createStartInstanceConfigForm({
      renderHeader
    });

    // then
    expect(wrapper.find('.section__header').exists()).to.be.true;
  });


  it('should render default submit button', function() {

    // when
    const wrapper = createStartInstanceConfigForm();

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql('Submit');
  });


  it('should render custom submit button', function() {

    // given
    const renderSubmit = 'Custom Submit';

    // when
    const wrapper = createStartInstanceConfigForm({
      renderSubmit
    });

    // then
    expect(wrapper.find('button[type="submit"]').text()).to.eql(renderSubmit);
  });


  describe('fields', function() {

    describe('variables', function() {

      it('should render', function() {

        // when
        const wrapper = createStartInstanceConfigForm();

        // then
        expect(wrapper.find('label[htmlFor="variables"]').exists()).to.be.true;
      });

    });

  });


  describe('submission', function() {

    it('should submit', async function() {

      // given
      const onSubmitSpy = sinon.spy();

      const wrapper = createStartInstanceConfigForm({
        onSubmit: onSubmitSpy
      });

      // when
      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('change', {
          target: { name: 'variables', value: '{ "foo": "bar" }' }
        });
      });

      wrapper.update();

      await act(async () => {
        wrapper.find('form').simulate('submit');
      });

      wrapper.update();

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
        expect(wrapper.find('button[type="submit"]').prop('disabled')).to.be.true;

        return Promise.resolve();
      });

      const wrapper = createStartInstanceConfigForm({
        onSubmit: onSubmitSpy
      });

      // when
      await act(async () => {
        wrapper.find('form').simulate('submit');
      });

      wrapper.update();

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

      const wrapper = createStartInstanceConfigForm({
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
        wrapper.find('form').simulate('submit');
      });

      wrapper.update();

      // then
      expect(validateFieldSpy.callCount).to.eql(1);
      expect(validateFormSpy.callCount).to.eql(1);
    });


    it('should validate form on blur', async function() {

      // given
      const validateFieldSpy = sinon.spy(),
            validateFormSpy = sinon.spy();

      const wrapper = createStartInstanceConfigForm({
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
        wrapper.find('textarea[name="variables"]').simulate('blur', {
          target: { name: 'variables', value: '{ "foo": "bar" }' }
        });
      });

      wrapper.update();

      // then
      expect(validateFieldSpy.callCount).to.eql(1);
      expect(validateFormSpy.callCount).to.eql(1);
    });


    it('should validate field value on change', async function() {

      // given
      const validateFieldSpy = sinon.spy();

      const wrapper = createStartInstanceConfigForm({
        validateField: validateFieldSpy
      });

      // when
      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('change', {
          target: { name: 'variables', value: '{ "foo": "bar" }' }
        });
      });

      wrapper.update();

      // then
      expect(validateFieldSpy).to.have.been.calledWith('variables', '{ "foo": "bar" }');
    });


    it('should add field error (getFieldError)', async function() {

      // given
      const wrapper = createStartInstanceConfigForm({
        getFieldError: (fieldName) => {
          return fieldName === 'variables' ? 'Error' : undefined;
        }
      });

      // then
      expect(wrapper.find('.invalid-feedback').text()).to.eql('Error');
    });


    it('should add field error (meta.error)', async function() {

      // given
      const wrapper = createStartInstanceConfigForm({
        validateField: (name, value) => name === 'variables' && value === '{' ? 'Error' : undefined
      });

      // when
      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('change', {
          target: { name: 'variables', value: '{' }
        });
      });

      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('blur');
      });

      wrapper.update();

      // then
      expect(wrapper.find('.invalid-feedback').text()).to.eql('Error');
    });


    it('should remove field error (getFieldError)', async function() {

      // given
      let error = 'Error';

      const getFieldError = (meta, fieldName) => fieldName === 'variables' ? error : undefined;

      const wrapper = createStartInstanceConfigForm({
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
        wrapper.find('textarea[name="variables"]').simulate('change', {
          target: { name: 'variables', value: 'bar' }
        });
      });

      wrapper.update();

      // then
      expect(wrapper.find('.invalid-feedback').exists()).to.be.false;
    });


    it('should remove field error (meta.error)', async function() {

      // given
      const wrapper = createStartInstanceConfigForm({
        validateField: (name, value) => name === 'variables' && value === 'foo' ? 'Error' : undefined
      });

      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('change', {
          target: { name: 'variables', value: 'foo' }
        });
      });

      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('blur');
      });

      wrapper.update();

      // when
      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('change', {
          target: { name: 'variables', value: 'bar' }
        });
      });

      await act(async () => {
        wrapper.find('textarea[name="variables"]').simulate('blur');
      });

      wrapper.update();


      expect(wrapper.find('.invalid-feedback').exists()).to.be.false;
    });

  });

});

const DEFAULT_INITIAL_FIELD_VALUES = {
  variables: '{}'
};

function createStartInstanceConfigForm(props = {}) {
  let {
    getFieldError = (meta, fieldName) => {},
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

  return mount(<StartInstanceConfigForm
    getFieldError={ getFieldError }
    initialFieldValues={ initialFieldValues }
    onSubmit={ onSubmit }
    renderHeader={ renderHeader }
    renderSubmit={ renderSubmit }
    validateField={ validateField }
    validateForm={ validateForm }
    VariablesComponent={ VariablesComponent }
    variablesComponentProps={ variablesComponentProps } />);
}