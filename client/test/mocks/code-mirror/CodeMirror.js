/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
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