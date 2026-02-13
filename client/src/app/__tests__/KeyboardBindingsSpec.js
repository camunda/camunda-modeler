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

import KeyboardBindings, {
  find,
  findAll,
  findAndReplaceAll
} from '../KeyboardBindings';

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


  describe('custom', function() {

    it('should handle keydown event', function() {

      // given
      event = createKeyEvent('F');

      keyboardBindings.update([ {
        custom: {
          key: 'F',
          keydown: 'foo'
        }
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledTwice;

      expect(actionSpy.alwaysCalledWith('foo', event)).to.be.true;
    });


    it('should handle keypress event', function() {

      // given
      event = createKeyEvent('F');

      keyboardBindings.update([ {
        custom: {
          key: 'F',
          keypress: 'foo'
        }
      } ]);

      // when
      keyboardBindings._keyPressHandler(event);

      keyboardBindings._keyPressHandler(event);

      keyboardBindings._keyUpHandler(event);

      keyboardBindings._keyPressHandler(event);

      // then
      expect(actionSpy).to.have.been.calledTwice;

      expect(actionSpy.alwaysCalledWith('foo', event)).to.be.true;
    });


    it('should handle keyup event', function() {

      // given
      event = createKeyEvent('F');

      keyboardBindings.update([ {
        custom: {
          key: 'F',
          keyup: 'foo'
        }
      } ]);

      // when
      keyboardBindings._keyUpHandler(event);

      keyboardBindings._keyUpHandler(event);

      // then
      expect(actionSpy).to.have.been.calledTwice;

      expect(actionSpy.alwaysCalledWith('foo', event)).to.be.true;
    });

  });


  it('copy', function() {

    // given
    event = createKeyEvent('C', { ctrlKey: true });

    keyboardBindings.update([ {
      accelerator: 'CommandOrControl + C',
      action: 'copy'
    } ]);

    // when
    keyboardBindings._keyDownHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith('copy', event);
  });


  it('copySelectionAsImage', function() {

    // given
    event = createKeyEvent('C', { ctrlKey: true, shiftKey: true });

    keyboardBindings.update([ {
      accelerator: 'CommandOrControl + Shift + C',
      action: 'copySelectionAsImage'
    } ]);

    // when
    keyboardBindings._keyDownHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith('copySelectionAsImage', event);
  });


  it('cut', function() {

    // given
    event = createKeyEvent('X', { ctrlKey: true });

    keyboardBindings.update([ {
      accelerator: 'CommandOrControl + X',
      action: 'cut'
    } ]);

    // when
    keyboardBindings._keyDownHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith('cut', event);
  });


  it('paste', function() {

    // given
    event = createKeyEvent('V', { ctrlKey: true });

    keyboardBindings.update([ {
      accelerator: 'CommandOrControl + V',
      action: 'paste'
    } ]);

    // when
    keyboardBindings._keyDownHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith('paste', event);
  });


  it('undo', function() {

    // given
    event = createKeyEvent('Z', { ctrlKey: true });

    keyboardBindings.update([ {
      accelerator: 'CommandOrControl + Z',
      action: 'undo'
    } ]);

    // when
    keyboardBindings._keyDownHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith('undo', event);
  });


  describe('redo', function() {

    it('redo (Ctrl + Y)', function() {

      // given
      event = createKeyEvent('Y', { ctrlKey: true });

      keyboardBindings.update([ {
        accelerator: 'CommandOrControl + Y',
        action: 'redo'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith('redo', event);
    });


    it('redo (Ctrl + Shift + Z)', function() {

      // given
      event = createKeyEvent('Z', { ctrlKey: true, shiftKey: true });

      keyboardBindings.update([ {
        accelerator: 'CommandOrControl + Y',
        action: 'redo'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith('redo', event);
    });

  });


  it('selectAll', function() {

    // given
    event = createKeyEvent('A', { ctrlKey: true });

    keyboardBindings.update([ {
      accelerator: 'CommandOrControl + A',
      action: 'selectAll'
    } ]);

    // when
    keyboardBindings._keyDownHandler(event);

    // then
    expect(actionSpy).to.have.been.calledWith('selectAll', event);
  });


  describe('removeSelection', function() {

    it('should NOT update primary <removeSelection>', function() {

      // given
      keyboardBindings = new KeyboardBindings({
        onAction: actionSpy,
        isMac: false
      });

      const entry = {
        accelerator: 'Delete',
        action: 'removeSelection'
      };

      // when
      const updated = keyboardBindings.update([ entry ]);

      // then
      expect(updated).to.deep.include(entry);
      expect(keyboardBindings.removeSelection).to.eql(entry);
    });


    it('should update primary <removeSelection>', function() {

      // given
      keyboardBindings = new KeyboardBindings({
        onAction: actionSpy,
        isMac: true
      });

      const entry = {
        accelerator: 'Delete',
        action: 'removeSelection'
      };

      // when
      const updated = keyboardBindings.update([ entry ]);

      const expectedEntry = {
        accelerator: 'Backspace',
        action: 'removeSelection'
      };

      // then
      expect(updated).not.to.deep.include(entry);
      expect(updated).to.deep.include(expectedEntry);
      expect(keyboardBindings.removeSelection).to.eql(expectedEntry);
    });


    it('secondary <removeSelection>', function() {

      // given
      event = createKeyEvent('Backspace');

      keyboardBindings.update([ {
        accelerator: 'Delete',
        action: 'removeSelection'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith('removeSelection', event);
    });


    it('secondary <removeSelection> - mac', function() {

      // given
      keyboardBindings = new KeyboardBindings({
        onAction: actionSpy,
        isMac: true
      });

      event = createKeyEvent('Delete');

      keyboardBindings.update([ {
        accelerator: 'Delete',
        action: 'removeSelection'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith('removeSelection', event);
    });
  });


  describe('replaceElement', function() {

    it('should trigger for R', function() {

      // given
      event = createKeyEvent('R');

      keyboardBindings.update([ {
        accelerator: 'R',
        action: 'replaceElement'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith('replaceElement', event);
    });


    it('should not trigger for Cmd+R', function() {

      // given
      event = createKeyEvent('R', { ctrlKey: true });

      keyboardBindings.update([ {
        accelerator: 'R',
        action: 'replaceElement'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.not.have.been.called;
    });

  });


  describe('createElement', function() {

    it('should trigger for N', function() {

      // given
      event = createKeyEvent('N');

      keyboardBindings.update([ {
        accelerator: 'N',
        action: 'createElement'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith('createElement');
    });


    it('should not trigger for Cmd+N', function() {

      // given
      event = createKeyEvent('N', { ctrlKey: true });

      keyboardBindings.update([ {
        accelerator: 'N',
        action: 'createElement'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.not.have.been.called;
    });

  });


  describe('appendElement', function() {

    it('should trigger for N', function() {

      // given
      event = createKeyEvent('A');

      keyboardBindings.update([ {
        accelerator: 'A',
        action: 'appendElement'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.have.been.calledWith('appendElement');
    });


    it('should not trigger for Cmd+A', function() {

      // given
      event = createKeyEvent('A', { ctrlKey: true });

      keyboardBindings.update([ {
        accelerator: 'A',
        action: 'appendElement'
      } ]);

      // when
      keyboardBindings._keyDownHandler(event);

      // then
      expect(actionSpy).to.not.have.been.called;
    });

  });


  it('#setOnAction', function() {

    // given
    event = createKeyEvent('A', { ctrlKey: true });

    keyboardBindings.update([ {
      accelerator: 'CommandOrControl + A',
      action: 'selectAll'
    } ]);

    const newActionSpy = spy();

    // when
    keyboardBindings.setOnAction(newActionSpy);

    // then
    keyboardBindings._keyDownHandler(event);

    expect(actionSpy).not.to.have.been.called;
    expect(newActionSpy).to.have.been.calledWith('selectAll', event);
  });


  describe('#find', function() {

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


  describe('#findAll', function() {

    it('should find all entries', function() {

      // given
      const menu = [
        [
          { accelerator: 'A', custom: true },
          { accelerator: 'B' }
        ],
        [
          { accelerator: 'C', custom: true }
        ]
      ];

      // when
      const entries = findAll(menu, entry => entry.custom);

      // then
      expect(entries).to.have.length(2);

      expect(entries).to.eql([
        menu[0][0],
        menu[1][0]
      ]);
    });

  });


  describe('#findAndReplaceAll', function() {

    it('should find all and replace entries', function() {

      // given
      const menu = [
        [
          { accelerator: 'A', custom: true },
          { accelerator: 'B' }
        ],
        [
          { accelerator: 'C', custom: true }
        ]
      ];

      // when
      const updated = findAndReplaceAll(
        menu,
        entry => entry.accelerator === 'A',
        { custom: false }
      );

      // then
      expect(updated).to.deep.eql([
        [
          { accelerator: 'A', custom: false },
          { accelerator: 'B' }
        ],
        [
          { accelerator: 'C', custom: true }
        ]
      ]);
    });

  });

});

/**
 * Create a fake key event for testing purposes.
 *
 * @param {string|number} key the key or keyCode/charCode
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
