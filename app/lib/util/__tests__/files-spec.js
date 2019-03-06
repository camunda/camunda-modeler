/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const path = require('path');

const {
  globJSON,
  globFiles
} = require('../files');


describe('files', function() {

  describe('#globJSON', function() {

    it('should load by name', function() {

      // when
      const { config } = globJSON({
        name: 'config.json',
        searchPaths: [
          absPath('files/bar')
        ]
      });

      // then
      expect(config).to.eql({ bar: 'BAR' });
    });


    it('should load by pattern', function() {

      // when
      const { config } = globJSON({
        name: '**/config.json',
        searchPaths: [
          absPath('files')
        ]
      });

      // then
      expect(config).to.eql({
        foo: 'FOO',
        bar: 'FOO OVERRIDE'
      });
    });


    it('should consider defaults', function() {

      // when
      const { config } = globJSON({
        name: 'config.json',
        searchPaths: [
          absPath('files/bar')
        ],
        defaults: {
          foo: 'default FOO',
          bar: 'default BAR'
        }
      });

      // then
      expect(config).to.eql({
        foo: 'default FOO',
        bar: 'BAR'
      });
    });


    it('should handle errors gracefully', function() {

      // when
      const { config } = globJSON({
        name: '**/*-json.json',
        searchPaths: [
          absPath('files')
        ]
      });

      // then
      expect(config).to.eql({
        good: 'JSON'
      });
    });

  });


  describe('#globFiles', function() {

    it('should find files by pattern', function() {

      // when
      const files = globFiles({
        pattern: '**/*-json.json',
        searchPaths: [
          absPath('files')
        ]
      });

      // then
      expect(files).to.eql([
        absPath('files/bar/good-json.json'),
        absPath('files/foo/not-json.json')
      ]);

    });

  });

});


function absPath(file) {
  return path.resolve(__dirname, file);
}