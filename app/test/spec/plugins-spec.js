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

    it('should scan plug-in files', function() {

      // when
      const plugins = new Plugins({
        paths: [
          __dirname + '/../fixtures/plugins/register'
        ]
      });

      // then
      const registeredPlugins = plugins.getAll();

      expect(Object.keys(registeredPlugins)).to.eql([
        'broken-menu',
        'ghost-paths',
        'OK',
        'with-script',
        'with-style'
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
