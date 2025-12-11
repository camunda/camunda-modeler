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

import {
  render,
  fireEvent,
  waitFor
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


  describe('sections', function() {

    it('should render section description when provided', function() {

      // given
      const schema = [ {
        title: 'Test Section',
        description: 'This is a test section description',
        properties: {
          'test.text': {
            type: 'text',
            label: 'Text Input'
          }
        }
      } ];

      // when
      const { getByText } = createSettingsForm({ schema });

      // then
      expect(getByText('This is a test section description')).to.exist;
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
                { property: 'radio', oneOf: [ 'one', 'three' ] }
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


  describe('validation constraints', function() {

    describe('notEmpty constraint', function() {

      it('should validate required field with boolean true (default message)', async function() {

        // given
        const schema = [
          {
            properties: {
              'test.requiredText': {
                type: 'text',
                label: 'Required Text',
                constraints: {
                  notEmpty: true
                }
              }
            }
          }
        ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} } });

        const field = container.querySelector('.form-group input[id="test.requiredText"]');
        fireEvent.change(field, { target: { value: '' } });
        fireEvent.blur(field);

        await waitFor(() => {
          const errorMessage = container.querySelector('.invalid-feedback');
          expect(errorMessage).to.exist;
          expect(errorMessage.textContent).to.equal('Required Text must not be empty');
        });

        // when
        fireEvent.change(field, { target: { value: 'some value' } });
        fireEvent.blur(field);

        // then
        await expectNoError(container);

      });


      it('should validate required field with custom error message', async function() {

        // given
        const schema = [
          {
            properties: {
              'test.requiredText': {
                type: 'text',
                label: 'Required Text',
                constraints: {
                  notEmpty: 'Please provide a value for this field'
                }
              }
            }
          }
        ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} } });

        // when
        const field = container.querySelector('.form-group input[id="test.requiredText"]');
        fireEvent.change(field, { target: { value: '' } });
        fireEvent.blur(field);

        // then
        await expectError(container, 'Please provide a value for this field');
      });

    });


    describe('pattern constraint', function() {

      it('should validate field with string pattern (default message)', async function() {

        // given
        const schema = [ {
          properties: {
            'test.emailField': {
              type: 'text',
              label: 'Email',
              constraints: {
                pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
              }
            }
          }
        } ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} } });

        // when
        const field = container.querySelector('.form-group input[id="test.emailField"]');
        fireEvent.change(field, { target: { value: 'invalid-email' } });
        fireEvent.blur(field);

        // then
        await expectError(container, 'Email must match pattern ^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$');
      });


      it('should validate field with pattern object', async function() {

        // given
        const schema = [
          {
            properties: {
              'test.emailField': {
                type: 'text',
                label: 'Email',
                constraints: {
                  pattern: {
                    value: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
                    message: 'Please enter a valid email address'
                  }
                }
              }
            }
          }
        ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} } });

        // when
        const field = container.querySelector('.form-group input[id="test.emailField"]');
        fireEvent.change(field, { target: { value: 'invalid-email' } });
        fireEvent.blur(field);

        // then
        await expectError(container, 'Please enter a valid email address');
      });


      it('should handle undefined', async function() {

        // given
        const schema = [
          {
            properties: {
              'test.select': {
                type: 'select',
                label: 'Select',
                options: [],
                constraints: {
                  pattern: {
                    value: 'second',
                    message: 'Please select the second option'
                  }
                }
              }
            }
          }
        ];

        // when
        const { container } = createSettingsForm({ schema, initialValues: { test: { select: undefined } } });

        // then
        await expectError(container, 'Please select the second option');
      });


      it('should pass validation when pattern matches', async function() {

        // given
        const schema = [
          {
            properties: {
              'test.emailField': {
                type: 'text',
                label: 'Email',
                constraints: {
                  pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
                }
              }
            }
          }
        ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} } });

        // assert validation triggered
        const field = container.querySelector('.form-group input[id="test.emailField"]');
        fireEvent.change(field, { target: { value: 'invalid' } });
        fireEvent.blur(field);

        await waitFor(() => {
          const errorMessage = container.querySelector('.invalid-feedback');
          expect(errorMessage).to.exist;
        });

        // when
        fireEvent.change(field, { target: { value: 'user@example.com' } });
        fireEvent.blur(field);

        // then
        await expectNoError(container);
      });


      it('should persist a valid value', async function() {

        // given
        const onChange = sinon.spy();
        const schema = [
          {
            properties: {
              'test.emailField': {
                type: 'text',
                label: 'Email',
                constraints: {
                  pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
                }
              }
            }
          }
        ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} }, onChange });

        const field = container.querySelector('.form-group input[id="test.emailField"]');

        // when
        fireEvent.change(field, { target: { value: 'test@example.com' } });
        fireEvent.blur(field);

        // then
        await expectNoError(container);
        expect(onChange).to.have.been.calledWith(sinon.match({ 'test': { 'emailField': 'test@example.com' } }));
      });


      it('should persist an invalid value', async function() {

        // given
        const onChange = sinon.spy();
        const schema = [
          {
            properties: {
              'test.emailField': {
                type: 'text',
                label: 'Email',
                constraints: {
                  pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$'
                }
              }
            }
          }
        ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} }, onChange });

        const field = container.querySelector('.form-group input[id="test.emailField"]');

        // when
        fireEvent.change(field, { target: { value: 'invalid-email' } });
        fireEvent.blur(field);

        // then
        await expectError(container, 'Email must match pattern ^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$');
        expect(onChange).to.have.been.calledWith(sinon.match({ 'test': { 'emailField': 'invalid-email' } }));
      });

    });


    describe('combined constraints', function() {

      it('should validate both notEmpty and pattern constraints', async function() {

        // given
        const schema = [
          {
            properties: {
              'test.urlField': {
                type: 'text',
                label: 'URL',
                constraints: {
                  notEmpty: true,
                  pattern: {
                    value: '^https?:\\/\\/.+',
                    message: 'URL must start with http:// or https://'
                  }
                }
              }
            }
          }
        ];

        const { container } = createSettingsForm({ schema, initialValues: { test: {} } });

        const field = container.querySelector('.form-group input[id="test.urlField"]');

        // when
        fireEvent.change(field, { target: { value: '' } });
        fireEvent.blur(field);

        // then
        await expectError(container, 'URL must not be empty');

        // when
        fireEvent.change(field, { target: { value: 'invalid-url' } });
        fireEvent.blur(field);

        // then
        await expectError(container, 'URL must start with http:// or https://');

        // when
        fireEvent.change(field, { target: { value: 'https://example.com' } });
        fireEvent.blur(field);

        // then
        await expectNoError(container);
      });

    });


    it('should show validation errors as soon as settings are opened', async function() {

      // given
      const schema = [
        {
          properties: {
            'test.requiredText': {
              type: 'text',
              label: 'Required Text',
              constraints: {
                notEmpty: true
              }
            }
          }
        }
      ];

      // when
      const { container } = createSettingsForm({ schema, initialValues: { test: {} } });

      // then
      await expectError(container, 'Required Text must not be empty');
    });


    it('should not validate fields without constraints', async function() {

      // given
      const schema = [ {
        properties: {
          'test.normalText': {
            type: 'text',
            label: 'Normal Text'
          }
        }
      } ];

      const { container } = createSettingsForm({ schema });

      // when
      const field = container.querySelector('.form-group input[id="test.normalText"]');
      fireEvent.change(field, { target: { value: '' } });
      fireEvent.blur(field);

      // then - give a small amount of time for any potential validation to occur
      // but since there are no constraints, no error should appear
      await new Promise(resolve => setTimeout(resolve, 10));

      await expectNoError(container);
    });

  });

});

// helpers
function createSettingsForm({ schema, values, initialValues, onChange = () => {} } = {}) {
  return render(
    <Formik
      initialValues={ initialValues }
    >
      <SettingsForm
        schema={ schema }
        values={ values }
        onChange={ onChange }
      />
    </Formik>
  );
}

async function expectNoError(container) {
  await waitFor(() => {
    const errorMessage = container.querySelector('.invalid-feedback');
    expect(errorMessage).to.not.exist;
  });
}

async function expectError(container, message) {
  await waitFor(() => {
    const errorMessage = container.querySelector('.invalid-feedback');
    expect(errorMessage).to.exist;

    message && expect(errorMessage.textContent).to.equal(message);
  });
}
