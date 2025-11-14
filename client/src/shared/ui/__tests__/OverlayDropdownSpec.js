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
  render,
  fireEvent
} from '@testing-library/react';

import { OverlayDropdown } from '..';


describe('<OverlayDropdown>', function() {

  let mockButtonRef;

  beforeEach(function() {
    mockButtonRef = {
      current: <button />
    };
  });

  it('should render button content', function() {

    // given
    const { getByText } = render((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // then
    expect(getByText('TestButton')).to.exist;
  });


  it('should open', function() {

    // given
    const { getByRole } = render((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    // then
    expect(getByRole('dialog')).to.exist;
  });


  it('should close when button is clicked again', function() {

    // given
    const { getByRole, queryByRole } = render((
      <OverlayDropdown items={ [] } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));
    const button = getByRole('button');
    fireEvent.click(button);

    // when
    fireEvent.click(button);

    // then
    expect(queryByRole('dialog')).to.not.exist;
  });


  it('should close when option is selected', function() {

    // given
    const items = [ { text: 'TestOption', onClick: () => {} } ];
    const { getByRole, getByTitle, queryByRole } = render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));
    const button = getByRole('button');
    fireEvent.click(button);

    // when
    const option = getByTitle('TestOption');
    fireEvent.click(option);

    // then
    expect(queryByRole('dialog')).to.not.exist;
  });


  it('should call passed onClick callback when option is selected', function() {

    // given
    const spy = sinon.spy();
    const items = [ { text: 'TestOption', onClick: spy } ];
    const { getByRole, getByTitle } = render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));
    const button = getByRole('button');
    fireEvent.click(button);

    // when
    const option = getByTitle('TestOption');
    fireEvent.click(option);

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

    const { getByRole } = render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    // then
    const sections = getByRole('dialog').querySelectorAll('section');
    expect(sections).to.have.length(3);
  });


  it('should set max height for option group', function() {

    // given
    const items = [
      { key: 'section', items: [], maxHeight: 300 }
    ];

    const { getByRole } = render((
      <OverlayDropdown items={ items } buttonRef={ mockButtonRef }>
        TestButton
      </OverlayDropdown>
    ));

    // when
    const button = getByRole('button');
    fireEvent.click(button);

    const section = getByRole('dialog').querySelector('section');

    // then
    expect(section.style.getPropertyValue('--section-max-height')).to.equal('300px');
  });


  describe('arrow navigation', function() {

    let rendered;

    function expectFocus(selector) {
      const newFocus = rendered.getByRole('dialog').querySelector(selector);
      expect(document.activeElement).to.eql(newFocus);
    }

    function focusAndNavigate(selector, keyCode) {
      const item = rendered.getByRole('dialog').querySelector(selector);

      item.focus();
      fireEvent.keyDown(item, { keyCode });
    }

    beforeEach(function() {

      const items = [
        { key: 'section1', items: [ { text: 'item1' }, { text: 'item2' } ] },
        { key: 'section2', items: [ { text: 'item3' }, { text: 'item4' } ] },
        { key: 'section3', items: [ { text: 'item5' }, { text: 'item6' } ] }
      ];

      rendered = render((
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