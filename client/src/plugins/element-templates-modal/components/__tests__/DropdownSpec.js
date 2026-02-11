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

import { render, fireEvent, screen } from '@testing-library/react';

import Dropdown from '../Dropdown';


describe('<Dropdown>', function() {

  it('should render', function() {

    // when
    render(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

    // then
    expect(screen.getByRole('button', { name: /Filter by Project/i })).to.exist;
  });


  describe('open dropdown', function() {

    it('should open dropdown', function() {

      // given
      render(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

      // when
      fireEvent.click(screen.getByRole('button'));

      // then
      expect(screen.getByText('foo')).to.exist;
      expect(screen.getByText('bar')).to.exist;
    });


    it('should close dropdown (click button)', function() {

      // given
      render(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // assume dropdown is open
      expect(screen.getByText('foo')).to.exist;

      // when
      fireEvent.click(button);

      // then
      expect(screen.queryByText('foo')).to.not.exist;
    });


    it('should close dropdown (global click)', function() {

      // given
      render(<Dropdown tagCounts={ DEFAULT_TAG_COUNTS } tagsSelected={ DEFAULT_TAGS_SELECTED } />);

      fireEvent.click(screen.getByRole('button'));

      // assume dropdown is open
      expect(screen.getByText('foo')).to.exist;

      // when
      fireEvent.mouseDown(document.body);

      // then
      expect(screen.queryByText('foo')).to.not.exist;
    });

  });


  describe('select tags', function() {

    it('should select tag', function() {

      // given
      const onChangeSpy = sinon.spy();

      render(
        <Dropdown
          tagCounts={ DEFAULT_TAG_COUNTS }
          tagsSelected={ DEFAULT_TAGS_SELECTED }
          onChange={ onChangeSpy }
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('foo'));

      // then
      expect(onChangeSpy).to.have.been.calledWithMatch([ 'foo' ]);
    });


    it('should deselect tag', function() {

      // given
      const onChangeSpy = sinon.spy();

      render(
        <Dropdown
          tagCounts={ DEFAULT_TAG_COUNTS }
          tagsSelected={ [ 'foo' ] }
          onChange={ onChangeSpy }
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('foo'));

      // then
      expect(onChangeSpy).to.have.been.calledWithMatch([]);
    });


    it('should clear selected tags', function() {

      // given
      const onChangeSpy = sinon.spy();

      render(
        <Dropdown
          tagCounts={ DEFAULT_TAG_COUNTS }
          tagsSelected={ [ 'foo', 'bar' ] }
          onChange={ onChangeSpy }
        />
      );

      fireEvent.click(screen.getByRole('button'));

      // when
      fireEvent.click(screen.getByText('Clear all'));

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