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
        const onSubmit = sinon.spy();
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

        const { container } = createSettingsForm({ schema, initialValues: { test: {} }, onSubmit });

        const field = container.querySelector('.form-group input[id="test.emailField"]');

        // when
        fireEvent.change(field, { target: { value: 'test@example.com' } });
        fireEvent.blur(field);

        // then
        await expectNoError(container);
        expect(onSubmit).to.have.been.calledWith(sinon.match({ 'test': { 'emailField': 'test@example.com' } }));
      });


      it('should not persist invalid value', async function() {

        // given
        const onSubmit = sinon.spy();
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

        const { container } = createSettingsForm({ schema, initialValues: { test: {} }, onSubmit });

        const field = container.querySelector('.form-group input[id="test.emailField"]');

        // when
        fireEvent.change(field, { target: { value: 'invalid-email' } });
        fireEvent.blur(field);

        // then
        await expectError(container, 'Email must match pattern ^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$');
        expect(onSubmit).not.to.have.been.called;
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


  describe('expandable table', function() {

    it('should render with empty placeholder', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            description: 'Test table description',
            formConfig: {
              emptyPlaceholder: 'No items added yet',
              addLabel: 'Add Item'
            },
            rowProperties: {
              'name': {
                type: 'text',
                hint: 'Name',
                default: 'Default Name'
              }
            },
            childProperties: {
              'description': {
                type: 'text',
                label: 'Description',
                default: 'Default Description'
              }
            }
          }
        }
      } ];

      // when
      const { container } = createSettingsForm({ schema });

      // then
      const label = container.querySelector('.custom-control-label');
      expect(label).to.exist;
      expect(label.textContent).to.equal('Expandable table');

      const description = container.querySelector('.custom-control-description');
      expect(description).to.exist;
      expect(description.textContent).to.equal('Test table description');

      const emptyPlaceholder = container.querySelector('p.empty-placeholder');
      expect(emptyPlaceholder).to.exist;
      expect(emptyPlaceholder.textContent).to.equal('No items added yet');

      const addButton = container.querySelector('button.add');
      expect(addButton).to.exist;
      expect(addButton.textContent).to.equal('Add Item');
    });


    it('should add new array item when add button is clicked', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            formConfig: {
              emptyPlaceholder: 'No items',
              addLabel: 'Add Item'
            },
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Default Name'
              }
            },
            childProperties: {
              'description': {
                type: 'text',
                label: 'Description',
                default: 'Default Description'
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({ schema, initialValues: { test: { } } });

      // when
      const addButton = container.querySelector('button.add');
      fireEvent.click(addButton);

      // then
      const table = container.querySelector('table');
      expect(table).to.exist;

      const rows = container.querySelectorAll('tr.cds--parent-row');
      expect(rows.length).to.equal(1);

      const emptyPlaceholder = container.querySelector('p.empty-placeholder');
      expect(emptyPlaceholder).to.not.exist;
    });


    it('should display row properties in collapsed row', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {
              'description': {
                type: 'text',
                label: 'Description',
                default: 'Test Description'
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name', description: 'Test Description' }
            ]
          }
        }
      });

      // then
      const cellContent = container.querySelector('span[name="test.expandableTable[0].name"]');
      expect(cellContent).to.exist;
      expect(cellContent.textContent).to.equal('Test Name');
    });

    it('should show row properties as input fields when expanded', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {
              'description': {
                type: 'text',
                label: 'Description'
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name', description: 'Test Description' }
            ]
          }
        }
      });

      // when
      const expandButton = container.querySelector('button.cds--table-expand__button');
      fireEvent.click(expandButton);

      // then
      const nameField = container.querySelector('input[id="test.expandableTable[0].name"]');
      expect(nameField).to.exist;
      expect(nameField.value).to.equal('Test Name');
    });

    it('should display child properties in expanded row', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {
              'description': {
                type: 'text',
                label: 'Description',
                default: 'Test Description'
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name', description: 'Test Description' }
            ]
          }
        }
      });

      // when
      const expandButton = container.querySelector('button.cds--table-expand__button');
      fireEvent.click(expandButton);

      // then
      const descriptionField = container.querySelector('input[id="test.expandableTable[0].description"]');
      expect(descriptionField).to.exist;
      expect(descriptionField.value).to.equal('Test Description');

      const label = container.querySelector('label[for="test.expandableTable[0].description"]');
      expect(label).to.exist;
      expect(label.textContent).to.equal('Description');
    });





    it('should remove array item when delete button is clicked', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            formConfig: {
              removeLabel: 'Remove Item'
            },
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {
              'description': {
                type: 'text',
                label: 'Description'
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name 1', description: 'Test Description 1' },
              { id: '2', name: 'Test Name 2', description: 'Test Description 2' }
            ]
          }
        }
      });

      // when
      const deleteButtons = container.querySelectorAll('button.remove');
      expect(deleteButtons.length).to.equal(2);

      fireEvent.click(deleteButtons[0]);

      // then
      const remainingDeleteButtons = container.querySelectorAll('button.remove');
      expect(remainingDeleteButtons.length).to.equal(1);

      const remainingCellContent = container.querySelector('input[id="test.expandableTable[0].description"]');
      expect(remainingCellContent.value).to.equal('Test Description 2');
    });


    it('should use default removeLabel when not provided', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {}
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name' }
            ]
          }
        }
      });

      // then
      const deleteButtonTooltip = container.querySelector('.cds--tooltip-content');
      expect(deleteButtonTooltip).to.exist;
      expect(deleteButtonTooltip.textContent).to.equal('Remove');
    });


    it('should support different field types in child properties', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {
              'textField': {
                type: 'text',
                label: 'Text Field'
              },
              'passwordField': {
                type: 'password',
                label: 'Password Field'
              },
              'booleanField': {
                type: 'boolean',
                label: 'Boolean Field'
              },
              'selectField': {
                type: 'select',
                label: 'Select Field',
                options: [
                  { label: 'Option 1', value: 'opt1' },
                  { label: 'Option 2', value: 'opt2' }
                ]
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name' }
            ]
          }
        }
      });

      // when
      const expandButton = container.querySelector('button.cds--table-expand__button');
      fireEvent.click(expandButton);

      // then
      const textField = container.querySelector('input[id="test.expandableTable[0].textField"]');
      expect(textField).to.exist;
      expect(textField.type).to.equal('text');

      const passwordField = container.querySelector('input[id="test.expandableTable[0].passwordField"]');
      expect(passwordField).to.exist;
      expect(passwordField.type).to.equal('password');

      const booleanField = container.querySelector('input[id="test.expandableTable[0].booleanField"]');
      expect(booleanField).to.exist;
      expect(booleanField.type).to.equal('checkbox');

      const selectField = container.querySelector('select[id="test.expandableTable[0].selectField"]');
      expect(selectField).to.exist;
    });


    it('should support conditional fields in child properties', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {
              'fieldSwitch': {
                type: 'select',
                label: 'Field Switch',
                default: 'text',
                options: [
                  { label: 'Text field', value: 'text' },
                  { label: 'Password field', value: 'password' }
                ]
              },
              'textField': {
                type: 'text',
                label: 'Text Field',
                condition: { property: 'fieldSwitch', equals: 'text' }
              },
              'passwordField': {
                type: 'password',
                label: 'Password Field',
                condition: { property: 'fieldSwitch', equals: 'password' }
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name', fieldSwitch: 'text' }
            ]
          }
        }
      });


      const expandButton = container.querySelector('button.cds--table-expand__button');
      fireEvent.click(expandButton);

      let textField = container.querySelector('input[id="test.expandableTable[0].textField"]');
      expect(textField).to.exist;

      let passwordField = container.querySelector('input[id="test.expandableTable[0].passwordField"]');
      expect(passwordField).to.not.exist;

      // when
      const switchField = container.querySelector('select[id="test.expandableTable[0].fieldSwitch"]');
      fireEvent.change(switchField, { target: { value: 'password' } });

      // then
      textField = container.querySelector('input[id="test.expandableTable[0].textField"]');
      expect(textField).to.not.exist;

      passwordField = container.querySelector('input[id="test.expandableTable[0].passwordField"]');
      expect(passwordField).to.exist;
    });


    it('should support constraints validation in child properties', async function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Test Name'
              }
            },
            childProperties: {
              'requiredField': {
                type: 'text',
                label: 'Required Field',
                constraints: {
                  notEmpty: 'This field is required'
                }
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: {
          test: {
            expandableTable: [
              { id: '1', name: 'Test Name', requiredField: '' }
            ]
          }
        }
      });

      // when
      const expandButton = container.querySelector('button.cds--table-expand__button');
      fireEvent.click(expandButton);

      const requiredField = container.querySelector('input[id="test.expandableTable[0].requiredField"]');
      fireEvent.change(requiredField, { target: { value: '' } });
      fireEvent.blur(requiredField);

      // then
      await waitFor(() => {
        const errorMessage = container.querySelector('.invalid-feedback');
        expect(errorMessage).to.exist;
        expect(errorMessage.textContent).to.equal('This field is required');
      });
    });


    it('should apply default values when adding new items', function() {

      // given
      const schema = [ {
        properties: {
          'test.expandableTable': {
            type: 'expandableTable',
            label: 'Expandable table',
            rowProperties: {
              'name': {
                type: 'text',
                default: 'Default Name'
              }
            },
            childProperties: {
              'description': {
                type: 'text',
                label: 'Description',
                default: 'Default Description'
              },
              'enabled': {
                type: 'boolean',
                label: 'Enabled',
                default: true
              }
            }
          }
        }
      } ];

      const { container } = createSettingsForm({
        schema,
        initialValues: { test: { expandableTable: [] } }
      });

      // when
      const addButton = container.querySelector('button.add');
      fireEvent.click(addButton);


      const expandButton = container.querySelector('button.cds--table-expand__button');
      fireEvent.click(expandButton);

      // then
      const nameField = container.querySelector('input[id="test.expandableTable[0].name"]');
      expect(nameField.value).to.equal('Default Name');

      const descriptionField = container.querySelector('input[id="test.expandableTable[0].description"]');
      expect(descriptionField.value).to.equal('Default Description');

      const enabledField = container.querySelector('input[id="test.expandableTable[0].enabled"]');
      expect(enabledField.checked).to.be.true;
    });

  });

});

// helpers
function createSettingsForm({ schema, values, initialValues, onSubmit = () => {} } = {}) {
  return render(
    <Formik
      initialValues={ initialValues }
      onSubmit={ onSubmit }
    >
      <SettingsForm
        schema={ schema }
        values={ values }
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
