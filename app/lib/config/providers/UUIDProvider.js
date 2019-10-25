/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');

const log = require('../../log')('app:config:uuid');

/**
 * Provides uniqueness of clients.
 */
class UUIDProvider {
  constructor(path) {
    this._cachedUUID = null;
    this._path = path;
  }

  get() {
    if (this._cachedUUID) {
      return this._cachedUUID;
    }
    if (fs.existsSync(this._path)) {
      try {
        const uuid = fs.readFileSync(this._path, 'utf8').toString().trim();
        if (!isValidUUID(uuid)) {
          this._cachedUUID = this.generateUUIDAndStore();
        } else {
          this._cachedUUID = uuid;
        }
      } catch (err) {
        this._cachedUUID = this.generateUUIDAndStore();
      }
    } else {
      this._cachedUUID = this.generateUUIDAndStore();
    }

    return this._cachedUUID;
  }

  generateUUIDAndStore() {
    const uuid = this.generateUUID();
    try {
      fs.writeFileSync(this._path, uuid);
    } catch (err) {
      log.error(`Error creating file ${ this._path } `, err);
    }
    return uuid;
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      // eslint-disable-next-line no-bitwise
      let r = Math.random() * 16 | 0, v = char == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = UUIDProvider;

function isValidUUID(testedUUID) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return !!testedUUID.match(uuidPattern);
}
