import FileSystem from '../FileSystem';

import { Backend } from '../../app/__tests__/mocks';


describe('file-system', function() {

  it('#openFiles', function() {

    // given
    const filePaths = [ 'foo', 'bar' ],
          options = { encoding: 'uft8' };

    const sendSpy = (type, fp, opts) => {

      // then
      expect(type).to.equal('files:open');

      expect(fp).to.eql(filePaths);

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const fileSystem = new FileSystem(backend);

    // when
    fileSystem.openFiles(filePaths, options);
  });


  it('#saveFile', function() {

    // given
    const filePath = 'foo',
          file = { contents: 'foo' },
          options = { encoding: 'uft8' };

    const sendSpy = (type, fp, f, opts) => {

      // then
      expect(type).to.equal('file:save');

      expect(fp).to.eql(filePath);
      expect(f).to.eql(file);

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const fileSystem = new FileSystem(backend);

    // when
    fileSystem.saveFile(filePath, file, options);
  });


  it('#readFile', function() {

    // given
    const filePath = 'foo',
          options = { encoding: 'uft8' };

    const sendSpy = (type, fp, opts) => {

      // then
      expect(type).to.equal('file:read');

      expect(fp).to.eql(filePath);

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const fileSystem = new FileSystem(backend);

    // when
    fileSystem.readFile(filePath, options);
  });


  it('#readFileStats', function() {

    // given
    const file = { contents: 'foo' };

    const sendSpy = (type, f) => {

      // then
      expect(type).to.equal('file:read-stats');

      expect(f).to.eql(file);
    };

    const backend = new Backend({ send: sendSpy });
    const fileSystem = new FileSystem(backend);

    // when
    fileSystem.readFileStats(file);
  });


  it('#writeFile', function() {

    // given
    const filePath = 'foo',
          file = { contents: 'foo' },
          options = { encoding: 'uft8' };

    const sendSpy = (type, fp, f, opts) => {

      // then
      expect(type).to.equal('file:write');

      expect(fp).to.eql(filePath);
      expect(f).to.eql(file);

      expect(opts).to.eql(options);
    };

    const backend = new Backend({ send: sendSpy });
    const fileSystem = new FileSystem(backend);

    // when
    fileSystem.writeFile(filePath, file, options);
  });

});