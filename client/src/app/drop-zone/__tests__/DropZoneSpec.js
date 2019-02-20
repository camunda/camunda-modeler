/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* global sinon */

import React from 'react';

import {
  shallow
} from 'enzyme';

import { DropZone } from '../DropZone';

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
