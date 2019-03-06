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
  isDropableItem
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
      const event = new MockDragEvent({
        type: 'image/gif',
        kind: 'file'
      });

      wrapper.simulate('dragover', event);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.false;

    });


    it('should render overlay during drag with a file', function() {

      // given
      const wrapper = shallow(<DropZone />);

      // when
      const event = new MockDragEvent({
        type: '',
        kind: 'file'
      });

      wrapper.simulate('dragover', event);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.true;

    });

  });


  describe('#handleDragLeave', function() {

    it('should not render overlay when drag is over', function() {

      // given
      const wrapper = shallow(<DropZone />);

      const dragOverEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });
      const dragLeaveEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });

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

      const dragOverEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });
      const dragLeaveEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });

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

      const dragOverEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });
      const dropEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });

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


    it('should call passed onDrop prop with files', function() {

      // given
      const dropSpy = sinon.spy();

      const wrapper = shallow(<DropZone onDrop={ dropSpy } />);

      const dragOverEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });
      const dropEvent = new MockDragEvent({
        type: '',
        kind: 'file'
      });

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('drop', dropEvent);

      // then
      expect(dropSpy).to.be.calledOnce;
      expect(dropSpy.getCall(0).args).to.have.lengthOf(1);
      expect(dropSpy.getCall(0).args[0]).to.be.an('Array').with.lengthOf(1);

    });

  });

});


describe('DropZone - isDropableItem', function() {

  function item(kind, type) {
    return { kind, type };
  }


  it('should detect droppable file types', function() {

    // given
    const droppables = [
      item('file', ''),
      item('file', 'text/plain'),
      item('file', 'application/xml'),
      item('file', 'application/rss+xml'),
      item('file', 'application/bpmn+xml'),
      item('file', 'application/cmmn'),
      item('file', 'application/dmn'),
      item('file', 'application/bpmn'),
      item('file', 'text/xml')
    ];


    // then
    droppables.forEach((item) => {
      if (!isDropableItem(item)) {
        throw new Error(`expected ${JSON.stringify(item)} to be droppable`);
      }
    });

  });


  it('should detect non-droppable file types', function() {

    // given
    const nonDroppables = [
      item('foo', 'application/xml'),
      item('file', 'application/png+image')
    ];

    // then
    nonDroppables.forEach((item) => {
      if (isDropableItem(item)) {
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
      files: items
    };
  }

  preventDefault() {}

  stopPropagation() {}
}
