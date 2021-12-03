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
  mount
} from 'enzyme';

import { CreateNewAction } from '../CreateNewAction';

const DEFAULT_ITEMS = [ { text: 'foo' }, { text: 'bar' } ];


describe('<CreateNewAction>', function() {

  it('should render', function() {
    expect(createTabAction).not.to.throw();
  });


  it('should open', function() {

    // given
    const {
      tree
    } = createTabAction();

    // assume
    expect(tree.exists('Overlay')).to.be.false;

    // when
    tree.find('button').simulate('click');

    // then
    expect(tree.exists('Overlay')).to.be.true;
  });


  it('should render items', function() {

    // given
    const {
      tree
    } = createTabAction();

    tree.find('button').simulate('click');

    // when
    const items = tree.find('Overlay li');

    // then
    expect(items).to.have.length(2);
  });


  it('should render items per group', function() {

    // given
    const newFileItems = [
      { key: 'A', items: [ ...DEFAULT_ITEMS ] },
      { key: 'B', items: [ ...DEFAULT_ITEMS ] },
      { key: 'C', items: [ ...DEFAULT_ITEMS ] }
    ];

    const {
      tree
    } = createTabAction({ newFileItems });

    tree.find('button').simulate('click');

    // when
    const sections = tree.find('Overlay section');

    // then
    expect(sections).to.have.length(3);
  });

});


// helpers /////////////////////////////////////

function createTabAction(options = {}) {
  const {
    newFileItems
  } = options;

  const tree = mount(
    <CreateNewAction newFileItems={ newFileItems || DEFAULT_ITEMS } />
  );

  const instance = tree.instance();

  return {
    tree,
    instance
  };
}