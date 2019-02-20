/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Dialog from '../Dialog';

import { Backend } from '../../app/__tests__/mocks';

describe('dialog', function() {

  it('#showOpenFilesDialog', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('dialog:open-files');

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const dialog = new Dialog(backend);

    const options = {
      defaultPath: 'foo',
      filter: {
        extensions: [ 'foo' ],
        name: 'foo'
      },
      title: 'Foo'
    };

    // when
    dialog.showOpenFilesDialog(options);
  });


  it('#showOpenFileErrorDialog', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('dialog:show');

      expect(opts).to.eql({
        type: 'error',
        title: 'Unrecognized file format',
        buttons: [
          { id: 'cancel', label: 'Close' }
        ],
        message: 'The file "foo" is not a foo, bar or baz file.'
      });
    };

    const backend = new Backend({ send: sendSpy });
    const dialog = new Dialog(backend);

    const options = {
      file: {
        name: 'foo'
      },
      types: [ 'foo', 'bar', 'baz' ]
    };

    // when
    dialog.showOpenFileErrorDialog(options);
  });


  it('#showSaveFileDialog', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('dialog:save-file');

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const dialog = new Dialog(backend);

    const options = {
      defaultPath: 'foo',
      filter: {
        extensions: [ 'foo' ],
        name: 'foo'
      },
      title: 'Foo'
    };

    // when
    dialog.showSaveFileDialog(options);
  });


  it('#showSaveFileErrorDialog', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('dialog:show');

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const dialog = new Dialog(backend);

    const options = {
      buttons: [
        { id: 'foo', label: 'Foo' }
      ],
      message: 'Foo',
      title: 'Foo',
      type: 'error'
    };

    // when
    dialog.showSaveFileErrorDialog(options);
  });


  it('#show', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('dialog:show');

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const dialog = new Dialog(backend);

    const options = {
      type: 'info',
      title: 'Foo',
      message: 'Foo!',
      buttons: [
        { id: 'foo', label: 'Foo' }
      ]
    };

    // when
    dialog.show(options);
  });


  it('#showCloseFileDialog', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('dialog:show');

      expect(opts).to.eql({
        type: 'question',
        title: 'Close File',
        message: 'Save changes to "foo" before closing?',
        buttons: [
          { id: 'cancel', label: 'Cancel' },
          { id: 'save', label: 'Save' },
          { id: 'discard', label: 'Don\'t Save' }
        ]
      });
    };

    const backend = new Backend({ send: sendSpy });
    const dialog = new Dialog(backend);

    const options = {
      name: 'foo'
    };

    // when
    dialog.showCloseFileDialog(options);
  });


  it('#showEmptyFileDialog', function() {

    // given
    const sendSpy = (type, opts) => {

      // then
      expect(type).to.equal('dialog:show');

      expect(opts).to.eql({
        type: 'info',
        title: 'Empty FOO file',
        buttons: [
          { id: 'cancel', label: 'Cancel' },
          { id: 'create', label: 'Create' }
        ],
        message: 'The file "foo" is empty.\nWould you like to create a new FOO diagram?'
      });
    };

    const backend = new Backend({ send: sendSpy });
    const dialog = new Dialog(backend);

    const options = {
      file: {
        name: 'foo'
      },
      type: 'foo'
    };

    // when
    dialog.showEmptyFileDialog(options);
  });

});