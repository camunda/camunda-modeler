/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import {
  getLatestStable,
  ENGINES,
  ENGINE_PROFILES
} from '../Engines';


describe('util/Engines', function() {

  describe('should provide latestStable', function() {

    function verifyLatestStable(platform, expected) {

      return function() {

        // then
        expect(getLatestStable(platform)).to.eql(expected);
      };
    }

    it('Platform', verifyLatestStable(ENGINES.PLATFORM, '7.24.0'));

    it('Cloud', verifyLatestStable(ENGINES.CLOUD, '8.10.0'));

  });

  describe('ENGINE_PROFILES', function() {

    it('should include 8.11.0 for Camunda Cloud', function() {
      const cloudProfile = ENGINE_PROFILES.find(p => p.executionPlatform === ENGINES.CLOUD);
      expect(cloudProfile.executionPlatformVersions).to.include('8.11.0');
    });

  });

});
