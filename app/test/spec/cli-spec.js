'use strict';

var Cli = require('../../lib/cli');

var path = require('path');


describe('cli', function() {

  describe('#parse', function() {

    it('parse Linux args', function() {

      // given
      var args = [ 'app', '--enable-logging', '--other-flag=1', '../fixtures/random.xml' ];

      // when
      var {
        files,
        flags
      } = Cli.parse(args, __dirname);

      // then
      expect(files).to.eql([
        path.resolve('app/test/fixtures/random.xml')
      ]);

      expect(flags).to.eql({
        'enable-logging': true,
        'other-flag': 1
      });
    });


    it('parse Linux args, just diagram file', function() {

      // given
      var args = [ 'app', '../fixtures/random.xml' ];

      // when
      var {
        files,
        flags
      } = Cli.parse(args, __dirname);

      // then
      expect(files).to.eql([
        path.resolve('app/test/fixtures/random.xml')
      ]);

      expect(flags).to.eql({ });
    });


    if (process.platform === 'win32') {

      it('parse Windows args', function() {

        // given
        var args = [ 'app', '--', '..\\fixtures\\random.xml' ];

        // when
        var {
          files,
          flags
        } = Cli.parse(args, __dirname);

        // then
        expect(files).to.eql([
          path.resolve('app/test/fixtures/random.xml')
        ]);

        expect(flags).to.eql({ });
      });


      it('parse Windows args, just diagram file', function() {

        // given
        var args = [ 'app', '..\\\\fixtures\\\\random.xml' ];

        // when
        var {
          files,
          flags
        } = Cli.parse(args, __dirname);

        // then
        expect(files).to.eql([
          path.resolve('app/test/fixtures/random.xml')
        ]);

        expect(flags).to.eql({ });
      });


      it('parse Windows args, double backslash', function() {

        // given
        var args = [ 'app', '--', '..\\\\fixtures\\\\random.xml' ];

        // when
        var {
          files,
          flags
        } = Cli.parse(args, __dirname);

        // then
        expect(files).to.eql([
          path.resolve('app/test/fixtures/random.xml')
        ]);

        expect(flags).to.eql({ });
      });

    } else {

      it.skip('parse Windows args');

      it.skip('parse Windows args, double backslash');

    }
  });

});