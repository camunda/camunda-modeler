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

    describe('Linux', function() {

      it('parse args', function() {

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

    });


    describe('MacOS', function() {

      it('parse args, just diagram file', function() {

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


      it('parse signature confirm notice', function() {

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

    });


    describe('Windows', function() {

      const it = process.platform === 'win32' ? global.it : global.it.skip;


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

    });

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


  describe('#filterArgs', function() {

    it('should filter chromium switches', function() {

      // given
      var args = [ '--allow-file-access-from-files', '--bar', '-xyz', '--hello=1231', '123' ];

      // when
      var actualArgs = Cli.filterArgs(args);

      // then
      expect(actualArgs).to.eql([ '--bar', '-xyz', '--hello=1231', '123' ]);
    });

  });

});


// helpers //////////////////

function absPath(file) {
  return path.resolve(__dirname, file);
}
