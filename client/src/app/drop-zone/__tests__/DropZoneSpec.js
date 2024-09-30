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
  shallow
} from 'enzyme';

import {
  DropZone,
  isDroppableItem
} from '../DropZone';


describe('<DropZone>', function() {

  describe('#render', function() {

    it('should render', function() {
      shallow(<DropZone />);
    });

  });


  describe('#handleDragOver', function() {

    it('should not render overlay during drag without file', function() {

      // given
      const wrapper = shallow(<DropZone />);

      // when
      const event = new MockDragEvent();

      wrapper.simulate('dragover', event);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.false;

    });


    it('should not render overlay during drag with a GIF', function() {

      // given
      const wrapper = shallow(<DropZone />);

      // when
      const event = new MockDragEvent(fileItem('image/gif'));

      wrapper.simulate('dragover', event);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.false;

    });


    it('should render overlay during drag with a file', function() {

      // given
      const wrapper = shallow(<DropZone />);

      // when
      const event = new MockDragEvent(fileItem());

      wrapper.simulate('dragover', event);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.true;

    });

  });


  describe('#handleDragLeave', function() {

    it('should not render overlay when drag is over', function() {

      // given
      const wrapper = shallow(<DropZone />);

      const dragOverEvent = new MockDragEvent(fileItem());
      const dragLeaveEvent = new MockDragEvent(fileItem());

      dragLeaveEvent.relatedTarget = null;

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('dragleave', dragLeaveEvent);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.false;

    });


    it('should render overlay when dragging over elements', function() {

      // given
      const wrapper = shallow(<DropZone />);

      const dragOverEvent = new MockDragEvent(fileItem());
      const dragLeaveEvent = new MockDragEvent(fileItem());

      dragLeaveEvent.relatedTarget = document.createElement('div');

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('dragleave', dragLeaveEvent);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.true;

    });

  });


  describe('#handleDrop', function() {

    it('should not render overlay when file is dropped', function() {

      // given
      const wrapper = shallow(<DropZone />);

      const dragOverEvent = new MockDragEvent(fileItem('bpmn'));
      const dropEvent = new MockDragEvent(fileItem('bpmn'));

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('drop', dropEvent);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.false;

    });


    it('should not call passed onDrop prop with event if no file is dragged', function() {

      // given
      const dropSpy = sinon.spy();

      const wrapper = shallow(<DropZone onDrop={ dropSpy } />);

      const dragOverEvent = new MockDragEvent();
      const dropEvent = new MockDragEvent();

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('drop', dropEvent);

      // then
      expect(dropSpy).to.have.not.been.called;

    });


    it('should call passed onDrop prop with filepaths from file', function() {

      // given
      const dropSpy = sinon.spy();
      const getFilePath = () => Promise.resolve('/diagram_1.bpmn');

      const wrapper = shallow(<DropZone onDrop={ dropSpy } getFilePath={ getFilePath } />);

      const dragOverEvent = new MockDragEvent(fileItem('text/bpmn'));
      const dropEvent = new MockDragEvent(fileItem('text/bpmn'));

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('drop', dropEvent);

      // then
      return expectEventually(() => {
        expect(dropSpy).to.be.calledOnce;
        expect(dropSpy).to.have.been.calledOnceWithExactly([ '/diagram_1.bpmn' ]);
      });
    });


    it('should call passed onDrop prop with filepaths from VSCode', function() {

      // given
      const dropSpy = sinon.spy();

      const wrapper = shallow(<DropZone onDrop={ dropSpy } />);

      const dragOverEvent = new MockDragEvent(vsCodeItem());
      const dropEvent = new MockDragEvent(vsCodeItem('/diagram.bpmn', '/form.form'));

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('drop', dropEvent);

      // then
      return expectEventually(() => {
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
      fileItem('application/cmmn'),
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
class MockDragEvent {
  constructor(...items) {
    this.dataTransfer = {
      items,
      files: items.filter(item => item.kind === 'file')
    };
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

async function expectEventually(expectStatement) {
  const sleep = time => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };

  for (let i = 0; i < 10; i++) {
    try {
      expectStatement();

      // success
      return;
    } catch {

      // do nothing
    }

    await sleep(50);
  }

  // let it fail correctly
  expectStatement();
}
