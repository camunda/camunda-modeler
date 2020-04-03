/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  isCmd as isCommandOrControl,
  isKey,
  isShift
} from 'diagram-js/lib/features/keyboard/KeyboardUtil';

import {
  isArray,
  omit
} from 'min-dash';


/**
 * Fixes issue with Electron applications on Linux and Windows. Checks for
 * menu item accelarators that can't be overridden (CommandOrControl+A/C/V) and
 * manually triggers corresponding editor actions.
 *
 * See https://github.com/electron/electron/issues/7165.
 */
export default class KeyboardBindings {

  /**
   * Constructor.
   *
   * @param {Object} options - Options.
   * @param {Object} [options.menu] - Menu.
   * @param {Function} [options.onAction] - Function to be called on action.
   */
  constructor(options = {}) {
    const {
      menu,
      onAction
    } = options;

    this.onAction = onAction;

    this.copy = null;
    this.cut = null;
    this.paste = null;
    this.selectAll = null;
    this.undo = null;
    this.redo = null;

    this.customEntries = [];

    this.pressedKeys = {};

    if (menu) {
      this.update(menu);
    }
  }

  bind() {
    window.addEventListener('keydown', this._keyDownHandler);
    window.addEventListener('keypress', this._keyPressHandler);
    window.addEventListener('keyup', this._keyUpHandler);
  }

  unbind() {
    window.removeEventListener('keydown', this._keyDownHandler);
    window.removeEventListener('keypress', this._keyPressHandler);
    window.removeEventListener('keyup', this._keyUpHandler);
  }

  _keyDownHandler = (event) => {
    let action = null;

    const { onAction } = this;

    const commandOrCtrl = isCommandOrControl(event);

    // copy
    if (commandOrCtrl && isCopy(event) && isEnabled(this.copy) && !hasRole(this.copy, 'copy')) {
      action = getAction(this.copy);
    }

    // cut
    if (commandOrCtrl && isCut(event) && isEnabled(this.cut) && !hasRole(this.cut, 'cut')) {
      action = getAction(this.cut);
    }

    // paste
    if (commandOrCtrl && isPaste(event) && isEnabled(this.paste) && !hasRole(this.paste, 'paste')) {
      action = getAction(this.paste);
    }

    // select all
    if (commandOrCtrl &&
      isSelectAll(event) &&
      isEnabled(this.selectAll) &&
      !hasRole(this.selectAll, 'selectAll')
    ) {
      action = getAction(this.selectAll);
    }

    // undo
    if (commandOrCtrl && isUndo(event) && isEnabled(this.undo) && !hasRole(this.undo, 'undo')) {
      action = getAction(this.undo);
    }

    // redo
    if (commandOrCtrl && isRedo(event) && isEnabled(this.redo) && !hasRole(this.redo, 'redo')) {
      action = getAction(this.redo);
    }

    // custom
    if (this.hasCustomEntry(event)) {
      action = this.getCustomAction(event, 'keydown');
    }

    if (action && onAction) {
      onAction(null, action);

      event.preventDefault();
    }
  }

  _keyPressHandler = (event) => {
    let action = null;

    const { onAction } = this;

    // custom
    if (this.hasCustomEntry(event)) {
      action = this.getCustomAction(event, 'keypress');
    }

    var { key } = event;

    if (action && onAction && !this.pressedKeys[ key ]) {
      onAction(null, action);

      this.pressedKeys[ key ] = true;

      event.preventDefault();
    }
  }

  _keyUpHandler = (event) => {
    let action = null;

    const { onAction } = this;

    // custom
    if (this.hasCustomEntry(event)) {
      action = this.getCustomAction(event, 'keyup');
    }

    if (action && onAction) {
      onAction(null, action);

      event.preventDefault();
    }

    var { key } = event;

    delete this.pressedKeys[ key ];
  }

  update(menu) {
    this.copy = findCopy(menu);
    this.cut = findCut(menu);
    this.paste = findPaste(menu);
    this.selectAll = findSelectAll(menu);
    this.undo = findUndo(menu);
    this.redo = findRedo(menu);

    this.updateCustomEntries(menu);
  }

  updateCustomEntries(menu) {
    this.customEntries = getCustomEntries(menu).reduce((customEntries, entry) => {
      const { custom } = entry;

      const { key } = custom;

      return {
        ...customEntries,
        [ key ]: omit(custom, [ 'key' ])
      };
    }, {});
  }

  hasCustomEntry(event) {
    const { key } = event;

    return this.customEntries[ key ];
  }

  getCustomAction(event, type) {
    const { key } = event;

    const entry = this.customEntries[ key ];

    if (!entry) {
      return null;
    }

    return entry[ type ] || null;
  }

  setOnAction(onAction) {
    this.onAction = onAction;
  }
}

// helpers //////////

// Ctrl + C
function isCopy(event) {
  return isKey(['c', 'C'], event) && isCommandOrControl(event);
}

// Ctrl + X
function isCut(event) {
  return isKey(['x', 'X'], event) && isCommandOrControl(event);
}

// Ctrl + V
function isPaste(event) {
  return isKey(['v', 'V'], event) && isCommandOrControl(event);
}

// Ctrl + A
function isSelectAll(event) {
  return isKey(['a', 'A'], event) && isCommandOrControl(event);
}

// Ctrl + Z
function isUndo(event) {
  return isKey(['z', 'Z'], event) && isCommandOrControl(event) && !isShift(event);
}

// Ctrl + Y or Ctrl + Shift + Z
function isRedo(event) {
  return isCommandOrControl(event) &&
    (isKey([ 'y', 'Y' ], event) || (isKey(['z', 'Z'], event) && isShift(event)));
}

/**
 * Compare accelerators ignoring whitespace and upper/lowercase.
 *
 * @param {string} a - Accelerator a.
 * @param {string} b - Accelerator b.
 *
 * @returns {boolean}
 */
function isAccelerator(a = '', b = '') {
  return a.replace(/\s+/g, '') === b.replace(/\s+/g, '');
}

/**
 * Find first matching entry.
 *
 * @param {Array} [menu] - Menu.
 * @param {Function} matcher - Matcher function.
 *
 * @returns {Object}
 */
export function find(menu = [], matcher) {
  return findAll(menu, matcher).shift();
}

/**
 * Find all matching entries.
 *
 * @param {Array} [menu] - Menu.
 * @param {Function} matcher - Matcher function.
 *
 * @returns {Array<Object>}
 */
export function findAll(menu = [], matcher) {
  return menu.reduce((found, entry) => {
    if (isArray(entry)) {
      return [
        ...found,
        ...findAll(entry, matcher)
      ];
    }

    if (matcher(entry)) {
      found = [
        ...found,
        entry
      ];
    }

    if (entry.submenu) {
      found = [
        ...found,
        ...findAll(entry.submenu, matcher)
      ];
    }

    return found;
  }, []);
}

function findCopy(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+C'));
}

function findCut(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+X'));
}

function findPaste(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+V'));
}

function findUndo(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+Z'));
}

function findRedo(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+Y'));
}

function findSelectAll(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+A'));
}

/**
 * Check wether entry is enabled. If not specified it is enabled.
 *
 * @param {Object} entry - Entry.
 *
 * @returns {boolean}
 */
function isEnabled(entry) {
  return entry && entry.enabled !== false;
}

function hasRole(entry, role) {
  return entry && entry.role && entry.role === role;
}

function getAction(entry) {
  return entry && entry.action;
}

function getCustomEntries(menu) {
  return findAll(menu, entry => {
    return entry.custom;
  });
}