/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const Cli = require('../cli');

const path = require('path');


describe('cli', function() {

  describe('#parse', function() {

    it('parse Linux args', function() {

      // given
      const args = [
        'app',
        '--enable-logging',
        '--other-flag=1',
        'cli/random.xml',
        'cli/non-existing.xml',
        'cli'
      ];

      // when
      const {
        files,
        flags
      } = Cli.parse(args, __dirname);

      // then
      expect(files).to.eql([
        absPath('cli/random.xml')
      ]);

      expect(flags).to.eql({
        'enable-logging': true,
        'other-flag': 1
      });
    });


    it('parse Linux args, just diagram file', function() {

      // given
      const args = [ 'app', 'cli/random.xml' ];

      // when
      const {
        files,
        flags
      } = Cli.parse(args, __dirname);

      // then
      expect(files).to.eql([
        absPath('cli/random.xml')
      ]);

      expect(flags).to.eql({ });
    });


    it('parse MacOS signature confirm notice', function() {

      // given
      const args = [
        '/path/to/app',
        '-psn_0_18749364'
      ];

      // when
      const {
        files
      } = Cli.parse(args, __dirname);

      // then
      expect(files).to.be.empty;
    });


    if (process.platform === 'win32') {

      it('parse Windows args', function() {

        // given
        const args = [ 'app', '--', 'cli\\random.xml' ];

        // when
        const {
          files,
          flags
        } = Cli.parse(args, __dirname);

        // then
        expect(files).to.eql([
          absPath('cli/random.xml')
        ]);

        expect(flags).to.eql({ });
      });


      it('parse Windows args, just diagram file', function() {

        // given
        const args = [ 'app', 'cli\\\\random.xml' ];

        // when
        const {
          files,
          flags
        } = Cli.parse(args, __dirname);

        // then
        expect(files).to.eql([
          absPath('cli/random.xml')
        ]);

        expect(flags).to.eql({ });
      });


      it('parse Windows args, double backslash', function() {

        // given
        const args = [ 'app', '--', 'cli\\\\random.xml' ];

        // when
        const {
          files,
          flags
        } = Cli.parse(args, __dirname);

        // then
        expect(files).to.eql([
          absPath('cli/random.xml')
        ]);

        expect(flags).to.eql({ });
      });

    } else {

      it.skip('parse Windows args');

      it.skip('parse Windows args, double backslash');

    }
  });


  describe('#appendArgs', function() {

    it('should filter negated args', function() {

      // given
      var args = [ '--no-foo', '--bar', '-xyz', '--hello=1231', '123' ];

      // when
      var actualArgs = Cli.appendArgs(args, [ '--foo', '--no-bar' ]);

      // then
      expect(actualArgs).to.eql([ '123', '-xyz', '--hello=1231', '--foo', '--no-bar' ]);
    });

  });

});


// helpers //////////////////

function absPath(file) {
  return path.resolve(__dirname, file);
}