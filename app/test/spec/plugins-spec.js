/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const path = require('path');
const proxyquire = require('proxyquire');

const Plugins = require('../../lib/plugins');


describe('Plugins', function() {

  it('should instantiate with empty path', function() {
    new Plugins();
    new Plugins({});
  });


  describe('register plugins', function() {

    it('should init with empty paths', function() {

      // when
      const plugins = new Plugins();

      // then
      const registeredPlugins = plugins.getAll();

      expect(registeredPlugins).to.be.empty;
    });


    it('should scan plug-in files', function() {

      // when
      const plugins = new Plugins({
        paths: [
          __dirname + '/../fixtures/plugins/register'
        ]
      });

      // then
      const registeredPlugins = plugins.getAll();

      expect(registeredPlugins.map(({ name, error }) => [ name, error ])).to.eql([
        [ 'broken-menu', true ],
        [ 'ghost-paths', true ],
        [ 'OK', undefined ],
        [ 'with-script', undefined ],
        [ 'with-style', undefined ]
      ]);
    });

  });


  describe('#getAssetPath', function() {

    it('should transform url to plugins path', function() {

      // given
      const plugins = new Plugins({
        paths: [
          __dirname + '/../fixtures/plugins/with-asset'
        ]
      });

      const assetUrl = 'app-plugins://plugin/assets/cat.png';
      const assetPath = 'file://' + path.join(__dirname, '/../fixtures/plugins/with-asset/plugins/plugin/assets/cat.png');

      // when
      const transformedUrl = plugins.getAssetPath(assetUrl);

      // then
      expect(transformedUrl).to.eql(assetPath);
    });


    it('should return null if plugins protocol does not apply', function() {

      // given
      const plugins = new Plugins({
        paths: [
          __dirname + '/../fixtures/plugins/with-asset'
        ]
      });

      const assetUrl = 'http://localhost:8000/with-asset/assets/cat.png';

      // when
      const transformedUrl = plugins.getAssetPath(assetUrl);

      // then
      expect(transformedUrl).to.be.null;
    });


    it('should prevent directory traversal', function() {

      // given
      const plugins = new Plugins({
        paths: [
          __dirname + '/../fixtures/plugins/with-asset'
        ]
      });

      // then
      expect(
        plugins.getAssetPath('app-plugins://plugin/../assets/../cat.png')
      ).to.eql(
        'file://' + path.join(__dirname, '/../fixtures/plugins/with-asset/plugins/plugin/cat.png')
      );

      expect(
        plugins.getAssetPath('app-plugins://plugin//../../../cat.png')
      ).to.eql(
        'file://' + path.join(__dirname, '/../fixtures/plugins/with-asset/plugins/plugin/cat.png')
      );
    });


    it('should prevent directory traversal on Windows', function() {

      // given
      const windowsPath = path.win32;
      const Plugins = proxyquire('../../lib/plugins', { path: windowsPath });

      const plugins = new Plugins({
        paths: [
          __dirname + '/../fixtures/plugins/with-asset'
        ]
      });

      // then
      expect(
        plugins.getAssetPath('app-plugins://plugin/../assets/../cat.png')
      ).to.eql(
        'file://' + windowsPath.join(__dirname, '/../fixtures/plugins/with-asset/plugins/plugin/cat.png')
      );

      expect(
        plugins.getAssetPath('app-plugins://plugin//../../../cat.png')
      ).to.eql(
        'file://' + windowsPath.join(__dirname, '/../fixtures/plugins/with-asset/plugins/plugin/cat.png')
      );
    });


    it('should accept and correct superfluous slash after the protocol', function() {

      // given
      const plugins = new Plugins({
        paths: [
          __dirname + '/../fixtures/plugins/with-asset'
        ]
      });

      const assetUrl = 'app-plugins:///plugin/assets/cat.png';
      const assetPath = 'file://' + path.join(__dirname, '/../fixtures/plugins/with-asset/plugins/plugin/assets/cat.png');

      // when
      const transformedUrl = plugins.getAssetPath(assetUrl);

      // then
      expect(transformedUrl).to.eql(assetPath);
    });
  });

});
