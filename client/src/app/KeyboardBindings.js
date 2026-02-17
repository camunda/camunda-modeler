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
  findIndex,
  forEach,
  isArray,
  omit
} from 'min-dash';


/**
 * Fixes issues with Electron applications on Linux, Windows and Mac. Checks for
 * menu item accelerators that can't be overridden (CommandOrControl+A/C/V) and
 * manually triggers corresponding editor actions.
 *
 * See https://github.com/electron/electron/issues/7165.
 *
 * Also, adds actions to accelerators which are already registered to other ones, since
 * multiple accelerators are currently not supported.
 *
 * See https://github.com/camunda/camunda-modeler/issues/1989.
 */
export default class KeyboardBindings {

  /**
   * Constructor.
   *
   * @param {Object} options - Options.
   * @param {Object} [options.menu] - Menu.
   * @param {Function} [options.onAction] - Function to be called on action.
   * @param {boolean} [options.isMac] - Whether platform is Mac or not.
   */
  constructor(options = {}) {
    const {
      menu,
      onAction,
      isMac
    } = options;

    this.onAction = onAction;

    this.isMac = isMac,

    this.copy = null;
    this.copyAsImage = null;
    this.cut = null;
    this.paste = null;
    this.selectAll = null;
    this.removeSelection = null;
    this.replaceElement = null;
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

    const {
      isMac,
      onAction
    } = this;

    const commandOrCtrl = isCommandOrControl(event);

    // copy selection as image
    if (commandOrCtrl && isCopyAsImage(event) && isEnabled(this.copyAsImage)) {
      action = getAction(this.copyAsImage);
    }

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

    // remove selection
    if (isSecondaryRemoveSelection(event, isMac) &&
      isEnabled(this.removeSelection) &&
      !hasRole(this.removeSelection, 'delete')
    ) {
      action = getAction(this.removeSelection);
    }

    // undo
    if (commandOrCtrl && isUndo(event) && isEnabled(this.undo) && !hasRole(this.undo, 'undo')) {
      action = getAction(this.undo);
    }

    // redo
    if (commandOrCtrl && isRedo(event) && isEnabled(this.redo) && !hasRole(this.redo, 'redo')) {
      action = getAction(this.redo);
    }

    // replace
    if (isReplace(event) && isEnabled(this.replaceElement)) {
      action = getAction(this.replaceElement);
    }

    // create
    if (isCreate(event) && isEnabled(this.createElement)) {
      action = getAction(this.createElement);
    }

    // append
    if (isAppend(event) && isEnabled(this.appendElement)) {
      action = getAction(this.appendElement);
    }

    // custom
    if (this.hasCustomEntry(event)) {
      action = this.getCustomAction(event, 'keydown');
    }

    if (action && onAction) {
      onAction(action, event);

      event.preventDefault();
    }
  };

  _keyPressHandler = (event) => {
    let action = null;

    const { onAction } = this;

    // custom
    if (this.hasCustomEntry(event)) {
      action = this.getCustomAction(event, 'keypress');
    }

    var { key } = event;

    if (action && onAction && !this.pressedKeys[ key ]) {
      onAction(action, event);

      this.pressedKeys[ key ] = true;

      event.preventDefault();
    }
  };

  _keyUpHandler = (event) => {
    let action = null;

    const { onAction } = this;

    // custom
    if (this.hasCustomEntry(event)) {
      action = this.getCustomAction(event, 'keyup');
    }

    if (action && onAction) {
      onAction(action, event);

      event.preventDefault();
    }

    var { key } = event;

    delete this.pressedKeys[ key ];
  };

  update(menu) {
    menu = this.updateRemoveSelectionEntry(menu);

    this.copy = findCopy(menu);
    this.copyAsImage = findCopyAsImage(menu);
    this.cut = findCut(menu);
    this.paste = findPaste(menu);
    this.selectAll = findSelectAll(menu);
    this.undo = findUndo(menu);
    this.redo = findRedo(menu);
    this.replaceElement = findReplaceElement(menu);
    this.createElement = findCreateElement(menu);
    this.appendElement = findAppendElement(menu);
    this.updateCustomEntries(menu);

    return menu;
  }

  updateRemoveSelectionEntry(menu) {

    // (1) set primary shortcut depending on platform
    const primaryAccelerator = this.isMac ? 'Backspace' : 'Delete';

    menu = findAndReplaceAll(
      menu,
      ({ accelerator }) => isAccelerator(accelerator, 'Delete'),
      { accelerator: primaryAccelerator }
    );

    // (2) register it
    this.removeSelection =
      find(menu, ({ accelerator }) => isAccelerator(accelerator, primaryAccelerator));

    return menu;
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
  return isKey([ 'c', 'C' ], event) && isCommandOrControl(event) && !isShift(event);
}

// Ctrl + Shift + C
function isCopyAsImage(event) {
  return isKey([ 'c', 'C' ], event) && isCommandOrControl(event) && isShift(event);
}

// Ctrl + X
function isCut(event) {
  return isKey([ 'x', 'X' ], event) && isCommandOrControl(event);
}

// Ctrl + V
function isPaste(event) {
  return isKey([ 'v', 'V' ], event) && isCommandOrControl(event);
}

// Ctrl + A
function isSelectAll(event) {
  return isKey([ 'a', 'A' ], event) && isCommandOrControl(event);
}

// Ctrl + Z
function isUndo(event) {
  return isKey([ 'z', 'Z' ], event) && isCommandOrControl(event) && !isShift(event);
}

// Ctrl + Y or Ctrl + Shift + Z
function isRedo(event) {
  return isCommandOrControl(event) &&
    (isKey([ 'y', 'Y' ], event) || (isKey([ 'z', 'Z' ], event) && isShift(event)));
}

// r
function isReplace(event) {
  return isKey([ 'r', 'R' ], event) && !isCommandOrControl(event) && !isShift(event);
}

// n
function isCreate(event) {
  return isKey([ 'n', 'N' ], event) && !isCommandOrControl(event) && !isShift(event);
}

// a
function isAppend(event) {
  return isKey([ 'a', 'A' ], event) && !isCommandOrControl(event) && !isShift(event);
}

// Secondary delete shortcut
// Delete (Mac), Backspace (Linux, Windows)
function isSecondaryRemoveSelection(event, isMac) {
  const key = isMac ? 'Delete' : 'Backspace';

  return isKey(key, event);
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

/**
 * Find all matching entries and replace properties.
 *
 * @param {Array} [menu] - Menu.
 * @param {Function} matcher - Matcher function.
 * @param {Object} overrides - Overriding properties.
 *
 *
 * @returns {Array<Object>}
 */
export function findAndReplaceAll(menu = [], matcher, overrides = {}) {

  let updatedMenu = menu;

  forEach(menu, entry => {
    if (isArray(entry)) {
      const idx = findIndex(menu, entry);

      updatedMenu[idx] = findAndReplaceAll(entry, matcher, overrides);
    }

    if (matcher(entry)) {
      const idx = findIndex(menu, entry);

      updatedMenu[idx] = {
        ...entry,
        ...overrides
      };
    }

    if (entry.submenu) {
      entry = {
        ...entry,
        submenu: findAndReplaceAll(entry.submenu, matcher, overrides)
      };
    }

  });

  return updatedMenu;
}

function findCopy(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+C'));
}

function findCopyAsImage(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'CommandOrControl+Shift+C'));
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

function findReplaceElement(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'R'));
}

function findCreateElement(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'N'));
}

function findAppendElement(menu) {
  return find(menu, ({ accelerator }) => isAccelerator(accelerator, 'A'));
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
