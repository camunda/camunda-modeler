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

import KeyboardBindings, { find } from '../KeyboardBindings';

import {
  assign,
  isString
} from 'min-dash';

const { spy } = sinon;


describe('KeyboardBindings', function() {

  let keyboardBindings,
      actionSpy,
      event;

  beforeEach(function() {
    actionSpy = new spy();

    keyboardBindings = new KeyboardBindings({
      onAction: actionSpy
    });
  });


  it('copy', function() {

    // given
    event = createKeyEvent('C', { ctrlKey: true });

    keyboardBindings.update([{
      accelerator: 'CommandOrControl + C',
      action: 'copy'
    }]);

    // when
    keyboardBindings._keyHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith(null, 'copy');
  });


  it('cut', function() {

    // given
    event = createKeyEvent('X', { ctrlKey: true });

    keyboardBindings.update([{
      accelerator: 'CommandOrControl + X',
      action: 'cut'
    }]);

    // when
    keyboardBindings._keyHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith(null, 'cut');
  });


  it('paste', function() {

    // given
    event = createKeyEvent('V', { ctrlKey: true });

    keyboardBindings.update([{
      accelerator: 'CommandOrControl + V',
      action: 'paste'
    }]);

    // when
    keyboardBindings._keyHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith(null, 'paste');
  });


  it('undo', function() {

    // given
    event = createKeyEvent('Z', { ctrlKey: true });

    keyboardBindings.update([{
      accelerator: 'CommandOrControl + Z',
      action: 'undo'
    }]);

    // when
    keyboardBindings._keyHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith(null, 'undo');
  });


  describe('redo', function() {

    it('redo (Ctrl + Y)', function() {

      // given
      event = createKeyEvent('Y', { ctrlKey: true });

      keyboardBindings.update([{
        accelerator: 'CommandOrControl + Y',
        action: 'redo'
      }]);

      // when
      keyboardBindings._keyHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith(null, 'redo');
    });


    it('redo (Ctrl + Shift + Z)', function() {

      // given
      event = createKeyEvent('Z', { ctrlKey: true, shiftKey: true });

      keyboardBindings.update([{
        accelerator: 'CommandOrControl + Y',
        action: 'redo'
      }]);

      // when
      keyboardBindings._keyHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith(null, 'redo');
    });

  });



  it('selectAll', function() {

    // given
    event = createKeyEvent('A', { ctrlKey: true });

    keyboardBindings.update([{
      accelerator: 'CommandOrControl + A',
      action: 'selectAll'
    }]);

    // when
    keyboardBindings._keyHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith(null, 'selectAll');
  });


  it('#setOnAction', function() {

    // given
    event = createKeyEvent('A', { ctrlKey: true });

    keyboardBindings.update([{
      accelerator: 'CommandOrControl + A',
      action: 'selectAll'
    }]);

    const newActionSpy = spy();

    // when
    keyboardBindings.setOnAction(newActionSpy);

    // then
    keyboardBindings._keyHandler(event);

    expect(actionSpy).not.to.have.been.called;
    expect(newActionSpy).to.have.been.calledWith(null, 'selectAll');
  });


  describe('find', function() {

    it('should find entry', function() {

      // given
      const menu = [
        [
          { accelerator: 'A' },
          { accelerator: 'B' }
        ],
        [
          { accelerator: 'C' }
        ]
      ];

      // when
      const entry = find(menu, entry => entry.accelerator === 'B');

      // then
      expect(entry).to.equal(menu[0][1]);
    });

  });

});

/**
 * Create a fake key event for testing purposes.
 *
 * @param {String|Number} key the key or keyCode/charCode
 * @param {Object} [attrs]
 *
 * @return {Event}
 */
function createKeyEvent(key, attrs) {
  var event = document.createEvent('Events') || new document.defaultView.CustomEvent('keyEvent');

  // init and mark as bubbles / cancelable
  event.initEvent('keydown', false, true);

  var keyAttrs = isString(key) ? { key: key } : { keyCode: key, which: key };

  return assign(event, keyAttrs, attrs || {});
}