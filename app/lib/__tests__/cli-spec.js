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

});


// helpers //////////////////

function absPath(file) {
  return path.resolve(__dirname, file);
}