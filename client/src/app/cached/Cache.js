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
  isFunction
} from 'min-dash';

const __DESTROY = '__destroy';


export default class Cache {

  constructor() {
    this._entries = {};
  }

  get(key) {
    return this._entries[key];
  }

  add(key, value) {
    this._entries[key] = value;

    return value;
  }

  destroy(key) {
    Object.keys(this._entries).forEach((k) => {
      if (k.indexOf(key) === 0) {
        const entry = this._entries[k];

        if (isFunction(entry[__DESTROY])) {
          entry[__DESTROY]();
        }

        delete this._entries[k];
      }
    });
  }
}

