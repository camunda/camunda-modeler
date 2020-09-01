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

import { mount } from 'enzyme';

import Dropdown from '../Dropdown';


describe('<Dropdown>', function() {


  it('should render', function() {

    // when
    const wrapper = mount(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

    // then
    expect(wrapper).to.exist;
  });


  describe('open dropdown', function() {

    it('should open dropdown', function() {

      // given
      const wrapper = mount(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

      // when
      const button = wrapper.find('.dropdown__button').first();

      button.simulate('click');

      // then
      expect(wrapper.state('open')).to.be.true;
      expect(wrapper.find('.dropdown__menu')).to.have.length(1);
    });


    it('should close dropdown (click button)', function() {

      // given
      const wrapper = mount(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

      wrapper.setState({ open: true });

      // when
      const button = wrapper.find('.dropdown__button').first();

      button.simulate('click');

      // then
      expect(wrapper.state('open')).to.be.false;
      expect(wrapper.find('.dropdown__items')).to.have.length(0);
    });


    it('should close dropdown (global click)', function() {

      // given
      const wrapper = mount(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

      const button = wrapper.find('.dropdown__button').first();

      button.simulate('click');

      // when
      simulate('mousedown', document);

      wrapper.update();

      // then
      expect(wrapper.state('open')).to.be.false;
      expect(wrapper.find('.dropdown__items')).to.have.length(0);
    });

  });


  describe('select tags', function() {

    it('should select tag', async function() {

      // given
      const onChangeSpy = sinon.spy();

      const { wrapper } = await createDropdown({ onChange: onChangeSpy });

      wrapper.setState({ open: true });

      const item = wrapper.findWhere(n => n.key() === 'foo').first();

      // when
      item.simulate('click');

      // then
      expect(onChangeSpy).to.have.been.calledWithMatch([ 'foo' ]);
    });


    it('should deselect tag', async function() {

      // given
      const onChangeSpy = sinon.spy();

      const { wrapper } = await createDropdown({
        onChange: onChangeSpy,
        tagsSelected: [ 'foo' ]
      });

      wrapper.setState({ open: true });

      const item = wrapper.findWhere(n => n.key() === 'foo').first();

      // when
      item.simulate('click');

      // then
      expect(onChangeSpy).to.have.been.calledWithMatch([]);
    });


    it('should clear selected tags', async function() {

      // given
      const onChangeSpy = sinon.spy();

      const { wrapper } = await createDropdown({
        onChange: onChangeSpy,
        tagsSelected: [ 'foo', 'bar' ]
      });

      wrapper.setState({ open: true });

      const item = wrapper.findWhere(n => n.key() === '__clear').first();

      // when
      item.simulate('click');

      // then
      expect(onChangeSpy).to.have.been.calledWithMatch([]);
    });

  });

});

// helpers //////////

const DEFAULT_TAGS_SELECTED = [];

const DEFAULT_TAG_COUNTS = {
  foo: 1,
  bar: 2
};

async function createDropdown(props = {}) {
  const defaultProps = {
    tagCounts: DEFAULT_TAG_COUNTS,
    tagsSelected: DEFAULT_TAGS_SELECTED,
    onChange() {}
  };

  const wrapper = mount(<Dropdown { ...{ ...defaultProps, ...props } } />);

  const instance = wrapper.instance();

  return {
    instance,
    wrapper
  };
}

function simulate(type, element) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    view: window
  });

  element.dispatchEvent(event);
}