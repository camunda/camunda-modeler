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
  render
} from '@testing-library/react';

import { Section } from '..';


describe('<Section>', function() {

  let wrapper;

  afterEach(function() {
    if (wrapper && wrapper.exists()) {
      wrapper.unmount();
    }
  });


  it('should render', function() {
    const { container } = render(
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

    expectHTML(container, `
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

    function expectStyle(container, expectedStyle) {
      const element = container.firstChild;
      Object.keys(expectedStyle).forEach(property => {
        if (property.startsWith('--')) {

          // CSS custom properties
          expect(element.style.getPropertyValue(property)).to.equal(expectedStyle[property]);
        } else {

          // Regular CSS properties
          expect(element.style[property]).to.equal(expectedStyle[property]);
        }
      });
    }


    it('should scroll (maxHeight=true)', function() {

      // when
      const { container } = render(<Section maxHeight={ true } />);

      // then
      expectStyle(container, {
        'overflowY': 'hidden'
      });

    });


    it('should specify string (maxHeight="100vh")', function() {

      // when
      const { container } = render(<Section maxHeight="100vh" />);

      // then
      expectStyle(container, {
        '--section-max-height': '100vh'
      });

    });


    it('should specify (pixel) number (maxHeight=100)', function() {

      // when
      const { container } = render(<Section maxHeight={ 100 } />);

      // then
      expectStyle(container, {
        '--section-max-height': '100px'
      });

    });

  });


  describe('<Section.Header>', function() {

    it('should render', function() {
      render(<Section.Header />);
    });

  });


  describe('<Section.Body>', function() {

    it('should render', function() {
      render(<Section.Body />);
    });

  });

});


function expectHTML(container, expectedHTML) {
  expect(container.innerHTML).to.eql(expectedHTML.replace(/\s*\n\s*/g, ''));
}
