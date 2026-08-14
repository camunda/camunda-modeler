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
  engineProfilesEqual,
  isKnownEngineProfile
} from './EngineProfile';

export default class EngineProfileHelper {
  constructor({ get, set, getCached, setCached, onChanged }) {
    this._get = get;
    this._set = set;
    this._getCached = getCached;
    this._setCached = setCached;
    this._onChanged = onChanged;
  }

  get() {
    const engineProfile = this._get();

    if (!isKnownEngineProfile(engineProfile)) {
      return fixExecutionPlatform(engineProfile);
    }

    return engineProfile;
  }

  set(engineProfile) {
    this._set(engineProfile);

    this.setCached(engineProfile);
  }

  getCached() {
    const { engineProfile } = this._getCached();

    return engineProfile;
  }

  setCached(engineProfile) {
    const { engineProfile: cachedEngineProfile } = this._getCached();

    if (!engineProfilesEqual(engineProfile, cachedEngineProfile)) {
      this._setCached({
        engineProfile
      });

      if (this._onChanged) {
        this._onChanged(engineProfile);
      }
    }
  }
}

function fixExecutionPlatform(engineProfile = {}) {
  const {
    executionPlatform = 'Camunda Cloud'
  } = engineProfile;

  if ([ 'Camunda Platform', 'Camunda Cloud' ].includes(executionPlatform)) {
    return engineProfile;
  }

  return {
    ...engineProfile,
    executionPlatform: 'Camunda Cloud'
  };
}