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
  render,
  fireEvent
} from '@testing-library/react';

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


  describe('conditional fields', function() {

    it('should show field if condition "equals true" is met', function() {

      // given
      const schema = [ {
        properties: {
          'test.checkbox': {
            type: 'boolean',
            label: 'Checkbox'
          },
          'test.text': {
            type: 'text',
            label: 'Text Input',
            condition: { property: 'checkbox', equals: true }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          'test': {
            'checkbox': false
          }
        }
      });

      // assume
      let textField = container.querySelector('.form-group [id="test.text"]');
      expect(textField).to.not.exist;

      // when
      fireEvent.click(container.querySelector('.form-group [id="test.checkbox"]'));

      // then
      textField = container.querySelector('.form-group [id="test.text"]');
      expect(textField).to.exist;
    });


    it('should support referencing other sections', function() {

      // given
      const schema = [
        {
          id: 'otherSection',
          properties: {
            'otherSection.checkbox': {
              type: 'boolean',
              label: 'Checkbox'
            },
          }
        },
        {
          id:'test',
          properties: {

            'test.text': {
              type: 'text',
              label: 'Text Input',
              condition: { property: 'otherSection.checkbox', equals: true }
            }
          }
        }
      ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          'otherSection': {
            'checkbox': false
          }
        }
      });

      // assume
      let textField = container.querySelector('.form-group [id="test.text"]');
      expect(textField).to.not.exist;

      // when
      fireEvent.click(container.querySelector('.form-group [id="otherSection.checkbox"]'));

      // then
      textField = container.querySelector('.form-group [id="test.text"]');
      expect(textField).to.exist;
    });


    it('should show field if condition "equals string" is met', function() {

      // given
      const schema = [ {
        properties: {
          'test.text': {
            type: 'text',
            label: 'Text to check'
          },
          'test.conditionalText': {
            type: 'text',
            label: 'shown if text is "show"',
            condition: { property: 'text', equals: 'show' }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          'test': {
            'text': ''
          }
        }
      });

      // assume
      let conditionalText = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalText).to.not.exist;

      // when
      fireEvent.change(container.querySelector('.form-group [id="test.text"]'), { target: { value: 'show' } });

      // then
      conditionalText = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalText).to.exist;
    });


    it('should show field if condition "oneOf" is met', function() {

      // given
      const schema = [ {
        properties: {
          'test.select': {
            type: 'select',
            label: 'Environment',
            options: [
              { label: 'Development', value: 'dev' },
              { label: 'Staging', value: 'staging' },
              { label: 'Production', value: 'prod' }
            ]
          },
          'test.conditionalText': {
            type: 'text',
            label: 'shown if select is "dev" or "staging"',
            condition: {
              property: 'select',
              oneOf: [ 'dev', 'staging' ]
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          'test': {
            'select': 'prod'
          }
        }
      });

      // assume
      let conditionalTextField = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalTextField).to.not.exist;

      // when
      fireEvent.change(container.querySelector('.form-group [id="test.select"]'), { target: { value: 'staging' } });

      // then
      conditionalTextField = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalTextField).to.exist;
    });


    it('should show field if allMatch condition is met', function() {

      // given
      const schema = [ {
        properties: {
          'test.checkbox': {
            type: 'boolean',
            label: 'Checkbox'
          },
          'test.radio': {
            type: 'radio',
            label: 'Radio',
            options: [
              { label: 'One', value: 'one' },
              { label: 'Two', value: 'two' },
              { label: 'Three', value: 'three' }
            ]
          },
          'test.conditionalText': {
            type: 'text',
            label: 'shown if allMatch (equals&oneOf) conditions are met',
            condition: {
              allMatch: [
                { property: 'checkbox', equals: true },
                { property: 'radio', oneOf: [ 'one' , 'three' ] }
              ]
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          'test': {
            'checkbox': false,
            'radio': 'one'
          }
        }
      });

      // assume
      let conditionalTextField = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalTextField).to.not.exist;

      // when
      fireEvent.click(container.querySelector('.form-group [id="test.checkbox"]'));

      // then
      conditionalTextField = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalTextField).to.exist;
    });


    it('should hide field if one of allMatch conditions is not met', function() {

      // given
      const schema = [ {
        properties: {
          'test.checkbox': {
            type: 'boolean',
            label: 'Checkbox'
          },
          'test.radio': {
            type: 'radio',
            label: 'Radio',
            options: [
              { label: 'One', value: 'one' },
              { label: 'Two', value: 'two' }
            ]
          },
          'test.conditionalText': {
            type: 'text',
            label: 'Conditional Text Input',
            condition: {
              allMatch: [
                { property: 'checkbox', equals: true },
                { property: 'radio', oneOf: [ 'one' ] }
              ]
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          'test': {
            'checkbox': true,
            'radio': 'one'
          }
        }
      });

      // assume
      let conditionalTextField = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalTextField).to.exist;

      // when
      fireEvent.click(container.querySelector('.form-group [id="test.checkbox"]'));

      // then
      conditionalTextField = container.querySelector('.form-group [id="test.conditionalText"]');
      expect(conditionalTextField).to.not.exist;
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
