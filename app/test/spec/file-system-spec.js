'use strict';

var fs = require('fs'),
    os = require('os'),
    sinon = require('sinon');

var FileSystem = require('../../lib/file-system');

var BASE64_ENCODED =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNby' +
      'blAAAADElEQVQImWNgoBMAAABpAAFEI8ARAAAAAElFTkSuQmCC';

var TEST_FILE_PATH = os.tmpdir() + '/camunda-modeler.fs.test';


describe('FileSystem', function() {

  var fileSystem;

  beforeEach(function() {
    fileSystem = new FileSystem({
      dialog: {}
    });
  });

  afterEach(function() {
    try {
      fs.unlinkSync(TEST_FILE_PATH);
    } catch (e) {
      console.log(e);
    }
  });


  it('should write BASE64 encoded file', function() {

    var file = {
      contents: BASE64_ENCODED
    };

    // when
    fileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = fileSystem.readFile(TEST_FILE_PATH, 'base64');

    // then
    expect(readFile.contents).to.match(/iVBOR/);
  });


  it('should write UTF8 encoded file', function() {

    var file = {
      contents: 'FOO BAR'
    };

    // when
    fileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = fileSystem.readFile(TEST_FILE_PATH);

    // then
    expect(readFile.contents).to.eql('FOO BAR');
  });


  it('should strip whitespace in read file', function() {

    var file = {
      contents: '  FOO BAR  \r\n\n'
    };

    // when
    fileSystem.writeFile(TEST_FILE_PATH, file);

    var readFile = fileSystem.readFile(TEST_FILE_PATH);

    // then
    expect(readFile.contents).to.eql('FOO BAR');
  });


  describe('should set last modified property', function() {

    it('on read', function() {
      // given
      var file = {
        contents: 'FOO BAR'
      };

      file = fileSystem.writeFile(TEST_FILE_PATH, file);
      // HFS+ tracks seconds only
      file.lastModified -= 1000;

      // when
      var updatedFile = fileSystem.readFile(TEST_FILE_PATH);

      // then
      expect(updatedFile.lastModified).to.be.above(file.lastModified);
    });


    it('on write', function() {
      // given
      var file = {
        contents: 'FOO BAR',
        // HFS+ tracks seconds only
        lastModified: new Date().getTime() - 1000
      };

      // when
      var newFile = fileSystem.writeFile(TEST_FILE_PATH, file);

      // then
      expect(newFile.lastModified).to.be.above(file.lastModified);
    });

  });


  describe('readFileStats', function() {

    beforeEach(function(done) {
      fs.writeFile(TEST_FILE_PATH, '', function(error) {
        done(error);
      });
    });


    it('should set last modified property on existing file', function() {
      // given
      var file = {
        path: TEST_FILE_PATH
      };

      // when
      var statsFile = fileSystem.readFileStats(file);

      // then
      expect(statsFile).to.have.property('lastModified').above(0);
    });


    it('should set last modified property to "0" if file is not accesible', function() {
      // given
      var file = {
        path: TEST_FILE_PATH + '.does-not-exist.xml'
      };

      // when
      var statsFile = fileSystem.readFileStats(file);

      // then
      expect(statsFile).to.have.property('lastModified').eql(0);
    });

  });


  describe('saveAs', function() {

    it('should save file', function() {
      // given
      fileSystem.dialog.showDialog = sinon.stub().callsFake(function(...args) {
        var callback = args.pop();

        callback(null, TEST_FILE_PATH);
      });

      var callbackSpy = sinon.spy();

      var file = {
        contents: 'foo'
      };

      // when
      fileSystem.saveAs(file, callbackSpy);

      // then
      expect(callbackSpy).to.be.called;
      expect(fs.existsSync(TEST_FILE_PATH)).to.be.true;
    });


    it('should call callback with error if save file dialog was cancelled', function() {
      // given
      fileSystem.dialog.showDialog = sinon.stub().callsFake(function(...args) {
        var callback = args.pop();

        callback();
      });

      var callbackSpy = sinon.spy();

      var file = {
        contents: 'foo'
      };

      // when
      fileSystem.saveAs(file, callbackSpy);

      // then
      expect(callbackSpy).to.be.calledOnce;
      expect(callbackSpy.lastCall.args[0]).to.be.instanceOf(Error);
      expect(fs.existsSync(TEST_FILE_PATH)).to.be.false;
    });

  });


  describe('#open', function() {

    const file1Path = getPath('foo'),
          file2Path = getPath('bar');

    beforeEach(function() {
      fileSystem.writeFile(file1Path, {
        contents: 'foo'
      });

      fileSystem.writeFile(file2Path, {
        contents: 'bar'
      });
    });


    it('should open a file', function() {

      // when
      const files = fileSystem.open(file1Path);

      // expect
      expect(files).to.have.length(1);
      expect(files[0].contents).to.equal('foo');
    });


    it('should open multiple files', function() {

      // when
      const files = fileSystem.open([
        file1Path,
        file2Path
      ]);

      // expect
      expect(files).to.have.length(2);
      expect(files[0].contents).to.equal('foo');
      expect(files[1].contents).to.equal('bar');
    });

  });

});

// helpers //////////

function getPath(name) {
  return `${ os.tmpdir }/camunda-modeler.fs${ name }.test`;
}