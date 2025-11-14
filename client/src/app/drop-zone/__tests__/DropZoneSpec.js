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

import {
  DropZone,
  isDroppableItem
} from '../DropZone';


describe('<DropZone>', function() {

  describe('#handleDragOver', function() {

    it('should not render overlay during drag without file', function() {

      // given
      const { dropzone, container } = renderDropZone();

      // when
      const event = new MockDragEvent();
      fireEvent.dragOver(dropzone, event);

      // then
      expect(container.querySelector('.box')).to.not.exist;
    });


    it('should not render overlay during drag with a GIF', function() {

      // given
      const { dropzone, container } = renderDropZone();

      // when
      const event = new MockDragEvent(fileItem('image/gif'));
      fireEvent.dragOver(dropzone, event);

      // then
      expect(container.querySelector('.box')).to.not.exist;

    });


    it('should render overlay during drag with a file', function() {

      // given
      const { dropzone, container } = renderDropZone();

      // when
      const event = new MockDragEvent(fileItem());
      fireEvent.dragOver(dropzone, event);

      // then
      expect(container.querySelector('.box')).to.exist;
    });

  });


  describe('#handleDragLeave', function() {

    it('should not render overlay when drag is over', function() {

      // given
      const { dropzone, container } = renderDropZone();

      const dragOverEvent = new MockDragEvent(fileItem());
      const dragLeaveEvent = new MockDragEvent(fileItem());

      dragLeaveEvent.relatedTarget = null;

      // when
      fireEvent.dragOver(dropzone, dragOverEvent);
      fireEvent.dragLeave(dropzone, dragLeaveEvent);

      // then
      expect(container.querySelector('.box')).to.not.exist;

    });


    it('should render overlay when dragging over elements', function() {

      // given
      const { dropzone, container } = renderDropZone();

      const dragOverEvent = new MockDragEvent(fileItem());
      const dragLeaveEvent = new MockDragEvent(fileItem());

      dragLeaveEvent.relatedTarget = document.createElement('div');

      // when
      fireEvent.dragOver(dropzone, dragOverEvent);
      fireEvent.dragLeave(dropzone, dragLeaveEvent);

      // then
      expect(container.querySelector('.box')).to.exist;

    });

  });


  describe('#handleDrop', function() {

    it('should not render overlay when file is dropped', function() {

      // given
      const { dropzone, container } = renderDropZone();

      const dragOverEvent = new MockDragEvent(fileItem('bpmn'));
      const dropEvent = new MockDragEvent(fileItem('bpmn'));

      // when
      fireEvent.dragOver(dropzone, dragOverEvent);
      fireEvent.drop(dropzone, dropEvent);

      // then
      expect(container.querySelector('.box')).to.not.exist;

    });


    it('should not call passed onDrop prop with event if no file is dragged', function() {

      // given
      const dropSpy = sinon.spy();

      const { dropzone } = renderDropZone({ onDrop: dropSpy });

      const dragOverEvent = new MockDragEvent();
      const dropEvent = new MockDragEvent();

      // when
      fireEvent.dragOver(dropzone, dragOverEvent);
      fireEvent.drop(dropzone, dropEvent);

      // then
      expect(dropSpy).to.have.not.been.called;

    });


    it('should call passed onDrop prop with filepaths from file', async function() {

      // given
      const dropSpy = sinon.spy();
      const getFilePath = () => Promise.resolve('/diagram_1.bpmn');

      const { dropzone } = renderDropZone({ onDrop: dropSpy, getFilePath });

      const dragOverEvent = new MockDragEvent(fileItem('text/bpmn'));
      const dropEvent = new MockDragEvent(fileItem('text/bpmn'));

      // when
      fireEvent.dragOver(dropzone, dragOverEvent);
      fireEvent.drop(dropzone, dropEvent);

      // then
      await waitFor(() => {
        expect(dropSpy).to.be.calledOnce;
        expect(dropSpy).to.have.been.calledOnceWithExactly([ '/diagram_1.bpmn' ]);
      });
    });


    it('should call passed onDrop prop with filepaths from VSCode', async function() {

      // given
      const dropSpy = sinon.spy();

      const { dropzone } = renderDropZone({ onDrop: dropSpy });

      const dragOverEvent = new MockDragEvent(vsCodeItem());
      const dropEvent = new MockDragEvent(vsCodeItem('/diagram.bpmn', '/form.form'));

      // when
      fireEvent.dragOver(dropzone, dragOverEvent);
      fireEvent.drop(dropzone, dropEvent);

      // then
      await waitFor(() => {
        expect(dropSpy).to.be.calledOnce;
        expect(dropSpy).to.have.been.calledOnceWithExactly([ '/diagram.bpmn', '/form.form' ]);
      });
    });
  });

});


describe('DropZone - isDropableItem', function() {

  it('should detect droppable file types', function() {

    // given
    const droppables = [
      fileItem(''),
      fileItem('text/plain'),
      fileItem('application/xml'),
      fileItem('application/rss+xml'),
      fileItem('application/bpmn+xml'),
      fileItem('application/dmn'),
      fileItem('application/bpmn'),
      fileItem('application/camunda-form'),
      fileItem('text/xml'),
      vsCodeItem('/my-file')
    ];


    // then
    droppables.forEach((item) => {
      if (!isDroppableItem(item)) {
        throw new Error(`expected ${JSON.stringify(item)} to be droppable`);
      }
    });

  });


  it('should detect non-droppable file types', function() {

    // given
    const nonDroppables = [
      item('foo', 'application/xml'),
      item('file', 'application/png+image'),
      item('string', 'text/plain')
    ];

    // then
    nonDroppables.forEach((item) => {
      if (isDroppableItem(item)) {
        throw new Error(`expected ${JSON.stringify(item)} to be non-droppable`);
      }
    });

  });

});


// helper /////

function renderDropZone(props = {}) {
  const rendered = render(
    <DropZone { ...props } />
  );

  return {
    dropzone: rendered.container.firstChild,
    ...rendered
  };
}

class MockDragEvent {

  constructor(item) {
    const dataTransfer = new DataTransfer();

    if (item) {
      Object.defineProperty(dataTransfer, 'items', {
        value: [ item ]
      });

      if (item.kind === 'file') {
        const mockFile = new File([], 'test-file', { type: item.type });
        Object.defineProperty(dataTransfer, 'files', {
          value: [ mockFile ]
        });
      }
    }

    this.dataTransfer = dataTransfer;
  }
  preventDefault() {}

  stopPropagation() {}
}

function item(kind, type, rest) {
  return {
    kind,
    type,
    ...rest
  };
}

function fileItem(type = '') {
  return item('file', type);
}

function vsCodeItem(...filepaths) {
  return item('string', 'codefiles', {
    getAsString(cb) {
      cb(JSON.stringify(filepaths));
    }
  });
}