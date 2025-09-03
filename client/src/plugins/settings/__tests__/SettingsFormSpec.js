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

import { render } from '@testing-library/react';

import { Formik } from 'formik';
import { SettingsForm } from '../SettingsForm';

describe('SettingsForm', function() {

  it('should render', function() {

    // when
    const { container } = createSettingsForm();

    // then
    expect(container).to.exist;
  });


  describe('should render form fields', function() {

    it('text input', function() {

      // given
      const schema = [ {
        properties: {
          'test.text': {
            type: 'text',
            label: 'Text Input'
          }
        }
      } ];

      // when
      const { container } = createSettingsForm({ schema });

      // then
      const field = container.querySelector('.form-group input[type="text"]');
      expect(field).to.exist;
    });


    it('password input', function() {

      // given
      const schema = [ {
        properties: {
          'test.password': {
            type: 'password',
            label: 'Password Input'
          }
        }
      } ];

      // when
      const { container } = createSettingsForm({ schema });

      // then
      const field = container.querySelector('.form-group input[type="password"]');
      expect(field).to.exist;
    });


    it('checkbox', function() {

      // given
      const schema = [ {
        properties: {
          'test.boolean': {
            type: 'boolean',
            label: 'Checkbox'
          }
        }
      } ];

      // when
      const { container } = createSettingsForm({ schema });

      // then
      const field = container.querySelector('.form-group input[type="checkbox"]');
      expect(field).to.exist;
    });


    it('select', function() {

      // given
      const schema = [ {
        properties: {
          'test.select': {
            type: 'select',
            label: 'Select',
            options: [
              { label: 'One', value: 'one' },
              { label: 'Two', value: 'two' }
            ]
          }
        }
      } ];

      // when
      const { container } = createSettingsForm({ schema });

      // then
      const field = container.querySelector('.form-group select');
      expect(field).to.exist;
    });


    it('radio', function() {

      // given
      const schema = [ {
        properties: {
          'test.radio': {
            type: 'radio',
            label: 'Radio',
            options: [
              { label: 'One', value: 'one' },
              { label: 'Two', value: 'two' }
            ]
          }
        }
      } ];

      // when
      const { container } = createSettingsForm({ schema });

      // then
      const field = container.querySelector('.form-group input[type="radio"]');
      expect(field).to.exist;
    });
  });
});


// helpers
function createSettingsForm({ schema, values, initialValues } = {}) {
  return render(
    <Formik
      initialValues={ initialValues }
    >
      <SettingsForm
        schema={ schema }
        values={ values }
      />
    </Formik>
  );
}
