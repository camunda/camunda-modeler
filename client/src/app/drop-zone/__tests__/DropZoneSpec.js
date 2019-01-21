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


    it('should render overlay during drag with a file', function() {

      // given
      const wrapper = shallow(<DropZone />);

      // when
      const event = new MockDragEvent({
        type: 'file'
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
        type: 'file'
      });
      const dragLeaveEvent = new MockDragEvent({
        type: 'file'
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
        type: 'file'
      });
      const dragLeaveEvent = new MockDragEvent({
        type: 'file'
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
        type: 'file'
      });
      const dropEvent = new MockDragEvent({
        type: 'file'
      });

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('drop', dropEvent);

      // then
      expect(wrapper.find('DropOverlay').exists()).to.be.false;

    });


    it('should call passed onDrop prop with event', function() {

      // given
      const dropSpy = sinon.spy();

      const wrapper = shallow(<DropZone onDrop={ dropSpy } />);

      const dragOverEvent = new MockDragEvent({
        type: 'file'
      });
      const dropEvent = new MockDragEvent({
        type: 'file'
      });

      // when
      wrapper.simulate('dragover', dragOverEvent);
      wrapper.simulate('drop', dropEvent);

      // then
      expect(dropSpy).to.be.calledOnce;
      expect(dropSpy.getCall(0).args).to.have.lengthOf(1);
      expect(dropSpy.getCall(0).args[0]).to.have.property('dataTransfer');

    });

  });

});



// helper /////
class MockDragEvent {
  constructor(...items) {
    this.dataTransfer = { items };
  }

  preventDefault() {}

  stopPropagation() {}
}
