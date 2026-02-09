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
  fireEvent,
  render,
  screen
} from '@testing-library/react';

import { FileInput } from '..';

/* global sinon */

describe('<FileInput>', function() {

  it('should render', function() {
    createFileInput();
  });


  it('should add files', function() {

    // given
    const setFieldValue = sinon.spy();
    const { container } = createFileInput({
      field: {
        name: 'name',
        value: []
      },
      form: {
        setFieldValue
      }
    });
    const input = container.querySelector('input[type="file"]');

    // when
    const newFiles = [ createFile() ];
    setFiles(input, newFiles);
    fireEvent.change(input);

    // then
    expect(setFieldValue).to.have.been.calledOnce;
    expect(setFieldValue.args).to.deep.equal([
      [ 'name', newFiles.map(file => createFileDescriptor(file)) ]
    ]);
  });


  it('should add only new files', function() {

    // given
    const initialValue = [ createFileDescriptor() ];
    const setFieldValue = sinon.spy();
    const { container } = createFileInput({
      field: {
        name: 'name',
        value: initialValue
      },
      form: {
        setFieldValue
      }
    });
    const input = container.querySelector('input[type="file"]');

    // when
    setFiles(input, initialValue);
    fireEvent.change(input);

    // then
    expect(setFieldValue).to.have.been.calledOnce;
    expect(setFieldValue.args).to.deep.equal([
      [ 'name', initialValue ]
    ]);
  });


  it('should remove files', function() {

    // given
    const initialValue = [ createFileDescriptor() ];
    const setFieldValue = sinon.spy();
    createFileInput({
      field: {
        name: 'name',
        value: initialValue
      },
      form: {
        setFieldValue
      }
    });

    // when
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    // then
    expect(setFieldValue).to.have.been.calledOnce;
    expect(setFieldValue.args).to.deep.equal([
      [ 'name', [] ]
    ]);
  });


  it('should display errors', function() {

    // given
    const error = 'invalid field';
    const initialValue = [ createFileDescriptor() ];

    // when
    const { container } = createFileInput({
      field: {
        name: 'name',
        value: initialValue
      },
      form: {
        errors: {
          name: [ error ]
        }
      }
    });

    // then
    const errorIcon = container.querySelector('svg.error-icon');
    expect(errorIcon).to.exist;
  });
});



// helpers ///////////////////

function createFileInput(options = {}) {
  const {
    field = { value: [] },
    form = {},
    ...props
  } = options;

  return render(<FileInput
    { ...props }
    field={ field }
    form={ form }
  />);
}

function createFile(options = {}) {
  return {
    name: 'file',
    lastModified: 1,
    contents: 'contents',
    ...options
  };
}

function createFileDescriptor(file = {}) {
  return {
    name: 'file',
    lastModified: 1,
    contents: file
  };
}

function setFiles(input, files) {
  Object.defineProperty(input, 'files', {
    value: files,
    writable: false,
    configurable: true
  });
}
