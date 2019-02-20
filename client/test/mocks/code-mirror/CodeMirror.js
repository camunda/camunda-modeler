/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default function create(options = {}) {
  let value = options.value || null,
      undo = options.undo || 0,
      redo = options.redo || 0;

  return {
    attachTo() {},
    detach() {},
    destroy() {},
    execCommand() {},
    on() {},
    off() {},
    getValue() {
      return value;
    },
    importXML(newValue) {
      value = newValue;
    },
    refresh() {},
    doc: {
      clearHistory() {},
      historySize() {
        return {
          undo,
          redo
        };
      },
      undo() {
        if (undo) {
          undo--;
          redo++;
        }
      },
      redo() {
        if (redo) {
          undo++;
          redo--;
        }
      },
      execute(commands) {
        undo += commands;
        redo = 0;
      }
    },
    get _stackIdx() {
      return undo;
    }
  };
}