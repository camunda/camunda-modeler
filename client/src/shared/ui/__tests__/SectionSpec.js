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
  shallow
} from 'enzyme';

import { Section } from '..';


describe('<Section>', function() {

  let wrapper;

  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should render', function() {
    const wrapper = shallow(
      <Section className="foo">
        <Section.Header>
          <span>{ 'HEADER' }</span>
          <Section.Actions>
            <button>{ 'BUTTON' }</button>
          </Section.Actions>
        </Section.Header>
        <Section.Body>
          <p>{ 'BODY' }</p>
        </Section.Body>
      </Section>
    );

    expectHTML(wrapper, `
      <section class="section foo">
        <h3 class="section__header">
          <span>HEADER</span>
          <span class="section__actions">
            <button>BUTTON</button>
          </span>
        </h3>
        <div class="section__body">
          <p>BODY</p>
        </div>
      </section>
    `);
  });


  describe('props#maxHeight', function() {

    function expectStyle(wrapper, expectedStyle) {
      expect(wrapper.prop('style')).to.eql(expectedStyle);
    }


    it('should scroll (maxHeight=true)', function() {

      // when
      wrapper = shallow(<Section maxHeight={ true } />);

      // then
      expectStyle(wrapper, {
        'overflow-y': 'hidden'
      });

    });


    it('should specify string (maxHeight="100vh")', function() {

      // when
      wrapper = shallow(<Section maxHeight="100vh" />);

      // then
      expectStyle(wrapper, {
        '--section-max-height': '100vh'
      });

    });


    it('should specify (pixel) number (maxHeight=100)', function() {

      // when
      wrapper = shallow(<Section maxHeight={ 100 } />);

      // then
      expectStyle(wrapper, {
        '--section-max-height': '100px'
      });

    });

  });


  describe('<Section.Header>', function() {

    it('should render', function() {
      wrapper = shallow(<Section.Header />);
    });

  });


  describe('<Section.Body>', function() {

    it('should render', function() {
      wrapper = shallow(<Section.Body />);
    });

  });

});


function expectHTML(wrapper, expectedHTML) {
  expect(wrapper.html()).to.eql(expectedHTML.replace(/\s*\n\s*/g, ''));
}
