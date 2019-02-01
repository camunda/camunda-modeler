'use strict';

const Cli = require('../../lib/cli');

const path = require('path');


describe('cli', function() {

  describe('#parse', function() {

    it('parse Linux args', function() {

      // given
      const args = [ 'app', '--enable-logging', '--other-flag=1', '../fixtures/random.xml' ];

      // when
      const {
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
      const args = [ 'app', '../fixtures/random.xml' ];

      // when
      const {
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
        const args = [ 'app', '--', '..\\fixtures\\random.xml' ];

        // when
        const {
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
        const args = [ 'app', '..\\\\fixtures\\\\random.xml' ];

        // when
        const {
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
        const args = [ 'app', '--', '..\\\\fixtures\\\\random.xml' ];

        // when
        const {
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