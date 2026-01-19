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
  getToggledGridLayout,
  getToggledPropertiesPanelLayout
} from '../layoutActions';


describe('layoutActions', function() {

  describe('getToggledGridLayout', function() {

    it('should toggle grid from false to true', function() {

      // given
      const layout = {
        grid: {
          visible: false
        }
      };

      // when
      const newLayout = getToggledGridLayout(layout);

      // then
      expect(newLayout).to.eql({
        grid: {
          visible: true
        }
      });
    });


    it('should toggle grid from true to false', function() {

      // given
      const layout = {
        grid: {
          visible: true
        }
      };

      // when
      const newLayout = getToggledGridLayout(layout);

      // then
      expect(newLayout).to.eql({
        grid: {
          visible: false
        }
      });
    });


    it('should default to false when grid is undefined', function() {

      // given
      const layout = {};

      // when
      const newLayout = getToggledGridLayout(layout);

      // then
      expect(newLayout).to.eql({
        grid: {
          visible: false
        }
      });
    });

  });


  describe('getToggledPropertiesPanelLayout', function() {

    const DEFAULT_LAYOUT = {
      open: true,
      width: 280
    };


    it('should toggle properties panel from false to true', function() {

      // given
      const layout = {
        propertiesPanel: {
          open: false
        }
      };

      // when
      const newLayout = getToggledPropertiesPanelLayout(layout, DEFAULT_LAYOUT);

      // then
      expect(newLayout).to.eql({
        propertiesPanel: {
          open: true,
          width: 280
        }
      });
    });


    it('should toggle properties panel from true to false', function() {

      // given
      const layout = {
        propertiesPanel: {
          open: true
        }
      };

      // when
      const newLayout = getToggledPropertiesPanelLayout(layout, DEFAULT_LAYOUT);

      // then
      expect(newLayout).to.eql({
        propertiesPanel: {
          open: false,
          width: 280
        }
      });
    });


    it('should close properties panel when undefined (fresh config)', function() {

      // given
      const layout = {};

      // when
      const newLayout = getToggledPropertiesPanelLayout(layout, DEFAULT_LAYOUT);

      // then
      // With fresh config, undefined is treated as "open" (default state),
      // so toggle closes it to false
      expect(newLayout).to.eql({
        propertiesPanel: {
          open: false,
          width: 280
        }
      });
    });


    it('should preserve width from existing layout', function() {

      // given
      const layout = {
        propertiesPanel: {
          open: true,
          width: 500
        }
      };

      // when
      const newLayout = getToggledPropertiesPanelLayout(layout, DEFAULT_LAYOUT);

      // then
      expect(newLayout).to.eql({
        propertiesPanel: {
          open: false,
          width: 500
        }
      });
    });

  });

});
