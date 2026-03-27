/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import VersionMismatchLintPlugin, {
  getVersionMismatchWarning
} from '../VersionMismatchLintPlugin';


describe('VersionMismatchLintPlugin', function() {


  describe('getVersionMismatchWarning', function() {

    it('should return warning when major versions differ', function() {

      // when
      const warning = getVersionMismatchWarning('8.7.0', '9.0.0');

      // then
      expect(warning).to.exist;
      expect(warning.category).to.equal('warn');
      expect(warning.rule).to.equal('camunda/version-mismatch');
      expect(warning.message).to.include('8.7');
      expect(warning.message).to.include('9.0');
    });


    it('should return warning when minor versions differ', function() {

      // when
      const warning = getVersionMismatchWarning('8.7.0', '8.8.0');

      // then
      expect(warning).to.exist;
      expect(warning.message).to.include('8.7');
      expect(warning.message).to.include('8.8');
    });


    it('should return null when versions match at major.minor', function() {

      // when
      const warning = getVersionMismatchWarning('8.8.0', '8.8.3');

      // then
      expect(warning).to.be.null;
    });


    it('should return null when selected version is null', function() {

      // when
      const warning = getVersionMismatchWarning(null, '8.8.0');

      // then
      expect(warning).to.be.null;
    });


    it('should return null when cluster version is null', function() {

      // when
      const warning = getVersionMismatchWarning('8.8.0', null);

      // then
      expect(warning).to.be.null;
    });


    it('should handle non-semver versions gracefully', function() {

      // when
      const warning = getVersionMismatchWarning('not-a-version', '8.8.0');

      // then
      expect(warning).to.be.null;
    });

  });


  describe('plugin factory', function() {

    it('should return warnings for cloud-bpmn tab with version mismatch', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: {
          success: true,
          response: { gatewayVersion: '8.8.0' }
        },
        engineProfiles: {
          'tab-1': { executionPlatformVersion: '8.7.0' }
        }
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'cloud-bpmn' });

      // then
      expect(warnings).to.have.length(1);
      expect(warnings[0].rule).to.equal('camunda/version-mismatch');
    });


    it('should return warnings for cloud-dmn tab', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: {
          success: true,
          response: { gatewayVersion: '8.8.0' }
        },
        engineProfiles: {
          'tab-1': { executionPlatformVersion: '8.7.0' }
        }
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'cloud-dmn' });

      // then
      expect(warnings).to.have.length(1);
    });


    it('should return warnings for cloud-form tab', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: {
          success: true,
          response: { gatewayVersion: '8.8.0' }
        },
        engineProfiles: {
          'tab-1': { executionPlatformVersion: '8.7.0' }
        }
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'cloud-form' });

      // then
      expect(warnings).to.have.length(1);
    });


    it('should return empty for non-cloud tab', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: {
          success: true,
          response: { gatewayVersion: '8.8.0' }
        },
        engineProfiles: {
          'tab-1': { executionPlatformVersion: '7.20.0' }
        }
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'bpmn' });

      // then
      expect(warnings).to.be.empty;
    });


    it('should return empty when connection is not successful', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: {
          success: false,
          reason: 'CONTACT_POINT_UNAVAILABLE'
        },
        engineProfiles: {
          'tab-1': { executionPlatformVersion: '8.7.0' }
        }
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'cloud-bpmn' });

      // then
      expect(warnings).to.be.empty;
    });


    it('should return empty when connection check result is null', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: null,
        engineProfiles: {
          'tab-1': { executionPlatformVersion: '8.7.0' }
        }
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'cloud-bpmn' });

      // then
      expect(warnings).to.be.empty;
    });


    it('should return empty when engine profile is not set', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: {
          success: true,
          response: { gatewayVersion: '8.8.0' }
        },
        engineProfiles: {}
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'cloud-bpmn' });

      // then
      expect(warnings).to.be.empty;
    });


    it('should return empty when versions match', function() {

      // given
      const getWarnings = VersionMismatchLintPlugin({
        connectionCheckResult: {
          success: true,
          response: { gatewayVersion: '8.8.3' }
        },
        engineProfiles: {
          'tab-1': { executionPlatformVersion: '8.8.0' }
        }
      });

      // when
      const warnings = getWarnings({ id: 'tab-1', type: 'cloud-bpmn' });

      // then
      expect(warnings).to.be.empty;
    });

  });

});
