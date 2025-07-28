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
  render, fireEvent
} from '@testing-library/react';

import MochaTestContainer from 'mocha-test-container-support';

import { OverlayDropdown } from '..';


describe('<OverlayDropdown>', function() {

  let testContainer, mockButtonRef;

  beforeEach(function() {
    testContainer = MochaTestContainer.get(this);
    const button = document.createElement('button');
    button.textContent = 'Test Button';
    testContainer.appendChild(button);

    mockButtonRef = {
      current: button
    };
  });

  afterEach(function() {
    testContainer.remove();
  });

  it('should render button content', function() {

    // given
    const { container } = render((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // then
    expect(container.textContent).to.include('TestButton');
  });


  it('should open', function() {

    // given
    render((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    fireEvent.click(mockButtonRef.current);

    // then
    expect(document.body.querySelector('[role=dialog]')).to.exist;
  });


  it('should close when button is clicked again', function() {

    // given
    const { container } = render((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));
    fireEvent.click(container.querySelector('button'));

    // when
    fireEvent.click(container.querySelector('button'));

    // then
    expect(document.body.querySelector('[role=dialog]')).to.not.exist;
  });


  it('should close when option is selected', function() {

    // given
    const items = [ { text: 'TestOption', onClick: () => {} } ];
    render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));
    fireEvent.click(mockButtonRef.current);

    // when
    fireEvent.click(document.body.querySelector('[role=dialog] button'));

    // then
    expect(document.body.querySelector('[role=dialog]')).to.not.exist;
  });


  it('should call passed onClick callback when option is selected', function() {

    // given
    const spy = sinon.spy();
    const items = [ { text: 'TestOption', onClick: spy } ];
    render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));
    fireEvent.click(mockButtonRef.current);

    // when
    fireEvent.click(document.body.querySelector('[role=dialog] button'));

    // then
    expect(spy).to.have.been.calledOnce;
  });


  it('should group options', function() {

    // given
    const items = [
      { key: 'A', items: [ { text: 'foo' } ] },
      { key: 'B', items: [ { text: 'bar' } ] },
      { key: 'C', items: [ { text: 'foo' } ] }
    ];

    render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    fireEvent.click(mockButtonRef.current);

    // then
    expect(document.body.querySelectorAll('[role=dialog] section')).to.have.length(3);
  });


  it('should set max height for option group', function() {

    // given
    const items = [
      { key: 'section', items: [], maxHeight: 300 }
    ];

    render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    fireEvent.click(mockButtonRef.current);

    const section = document.body.querySelector('[role=dialog] section');

    // then
    expect(section.style.getPropertyValue('--section-max-height')).to.equal('300px');
  });


  describe('arrow navigation', function() {

    function expectFocus(selector) {
      const element = document.querySelector(selector);
      expect(document.activeElement).to.equal(element);
    }

    function focusAndNavigate(selector, keyCode) {
      const item = document.querySelector(selector);
      item.focus();
      fireEvent.keyDown(item, { keyCode });
    }

    beforeEach(function() {

      const items = [
        { key: 'section1', items: [ { text: 'item1' }, { text: 'item2' } ] },
        { key: 'section2', items: [ { text: 'item3' }, { text: 'item4' } ] },
        { key: 'section3', items: [ { text: 'item5' }, { text: 'item6' } ] }
      ];

      render((
        <OverlayDropdown shouldOpen={ true } items={ items } buttonRef={ mockButtonRef }>
          foo
        </OverlayDropdown>
      ));
    });


    it('should auto-focus first element', function() {

      // then
      expectFocus('button[title="item1"]');
    });


    it('should focus next item', function() {

      // when
      focusAndNavigate('button[title="item1"]', 40);

      // then
      expectFocus('button[title="item2"]');
    });


    it('should focus next section', function() {

      // when
      focusAndNavigate('button[title="item2"]', 40);

      // then
      expectFocus('button[title="item3"]');
    });


    it('should focus first section', function() {

      // when
      focusAndNavigate('button[title="item6"]', 40);

      // then
      expectFocus('button[title="item1"]');
    });


    it('should focus previous item', function() {

      // when
      focusAndNavigate('button[title="item2"]', 38);

      // then
      expectFocus('button[title="item1"]');
    });


    it('should focus previous section', function() {

      // when
      focusAndNavigate('button[title="item3"]', 38);

      // then
      expectFocus('button[title="item2"]');
    });


    it('should focus last section', function() {

      // when
      focusAndNavigate('button[title="item1"]', 38);

      // then
      expectFocus('button[title="item6"]');
    });

  });

});
