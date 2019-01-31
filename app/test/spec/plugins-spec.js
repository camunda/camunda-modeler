'use strict';

const path = require('path');

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
