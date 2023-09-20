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
  globFiles,
  toPosixPath
} = require('../files');


describe('files', function() {

  describe('#globJSON', function() {

    it('should read given file name', function() {

      // when
      const { config } = globJSON('config.json', {
        searchPaths: [
          toAbsolutePath('files/bar')
        ]
      });

      // then
      expect(config).to.eql({ bar: 'BAR' });
    });


    it('should read given pattern', function() {

      // when
      const { config } = globJSON('**/config.json', {
        searchPaths: [
          toAbsolutePath('files')
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
      const { config } = globJSON('config.json', {
        searchPaths: [
          toAbsolutePath('files/bar')
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
      const { config } = globJSON('**/*-json.json', {
        searchPaths: [
          toAbsolutePath('files')
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
      const files = globFiles('**/*-json.json', {
        searchPaths: [
          toAbsolutePath('files')
        ]
      });

      // then
      expect(files).to.eql([
        toAbsolutePath('files/bar/good-json.json'),
        toAbsolutePath('files/foo/not-json.json')
      ]);

    });

  });

});


function toAbsolutePath(file) {
  return toPosixPath(path.resolve(__dirname, file));
}
