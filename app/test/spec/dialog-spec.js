'use strict';

const path = require('path');

const Dialog = require('../../lib/dialog');

const ElectronDialog = require('../helper/mock/electron-dialog'),
      Config = require('../helper/mock/config');

const { assign } = require('min-dash');

const USER_PATH = '/users/bpmn.io/',
      USER_DESKTOP_PATH = path.join(USER_PATH, 'desktop');


describe('Dialog', function() {
  let dialog,
      electronDialog,
      config;

  beforeEach(function() {
    config = new Config(USER_PATH);
    electronDialog = new ElectronDialog();

    dialog = new Dialog({
      electronDialog,
      config,
      userDesktopPath: USER_DESKTOP_PATH
    });
  });


  describe('#showDialog', function() {

    it('should show error dialog', async function() {

      // given
      electronDialog.setResponse(0);

      var options = {
        buttons: [{
          id: 'foo',
          label: 'Foo'
        }, {
          id: 'bar',
          label: 'Bar'
        }],
        title: 'error',
        type: 'error'
      };

      // when
      const result = await dialog.showDialog(options);

      // then
      var dialogArgs = getDialogArgs(electronDialog.showMessageBox);

      // then
      expect(electronDialog.showMessageBox).to.have.been.called;

      expect(dialogArgs.title).to.equal('error');
      expect(dialogArgs.buttons).to.have.length(2);

      expect(result).to.equal('foo');
    });


    it('should show warning dialog', async function() {

      // given
      electronDialog.setResponse(0);

      var options = {
        buttons: [{
          id: 'foo',
          label: 'Foo'
        }, {
          id: 'bar',
          label: 'Bar'
        }],
        title: 'warning',
        type: 'warning'
      };

      // when
      const result = await dialog.showDialog(options);

      // then
      var dialogArgs = getDialogArgs(electronDialog.showMessageBox);

      // then
      expect(electronDialog.showMessageBox).to.have.been.called;

      expect(dialogArgs.title).to.equal('warning');
      expect(dialogArgs.buttons).to.have.length(2);

      expect(result).to.equal('foo');
    });


    it('should show info dialog', async function() {

      // given
      electronDialog.setResponse(0);

      var options = {
        buttons: [{
          id: 'foo',
          label: 'Foo'
        }, {
          id: 'bar',
          label: 'Bar'
        }],
        title: 'info',
        type: 'info'
      };

      // when
      const result = await dialog.showDialog(options);

      // then
      var dialogArgs = getDialogArgs(electronDialog.showMessageBox);

      // then
      expect(electronDialog.showMessageBox).to.have.been.called;

      expect(dialogArgs.title).to.equal('info');
      expect(dialogArgs.buttons).to.have.length(2);

      expect(result).to.equal('foo');
    });


    it('should show question dialog', async function() {

      // given
      electronDialog.setResponse(0);

      var options = {
        buttons: [{
          id: 'foo',
          label: 'Foo'
        }, {
          id: 'bar',
          label: 'Bar'
        }],
        title: 'question',
        type: 'question'
      };

      // when
      const result = await dialog.showDialog(options);

      // then
      var dialogArgs = getDialogArgs(electronDialog.showMessageBox);

      // then
      expect(electronDialog.showMessageBox).to.have.been.called;

      expect(dialogArgs.title).to.equal('question');
      expect(dialogArgs.buttons).to.have.length(2);

      expect(result).to.equal('foo');
    });

  });


  describe('#showOpenDialog', function() {

    const options = {
      filters: {
        name: 'foo',
        extensions: [ 'foo' ]
      },
      title: 'foo'
    };


    it('should return filepaths', async function() {

      // given
      const filePaths = [ 'foo' ];

      electronDialog.setResponse(filePaths);

      // when
      const response = await dialog.showOpenDialog(options);

      // then
      expect(response).to.eql(filePaths);

      const args = getDialogArgs(electronDialog.showOpenDialog);

      expect(args).to.include(options);
    });


    it('should NOT return filepaths', async function() {

      // given
      electronDialog.setResponse(undefined);

      // when
      const response = await dialog.showOpenDialog(options);

      // then
      expect(response).to.eql([]);

      const args = getDialogArgs(electronDialog.showOpenDialog);

      expect(args).to.include(options);
    });


    describe('defaultPath', function() {

      it('should use userDesktopPath by default', async function() {

        // given
        electronDialog.setResponse([]);

        // when
        await dialog.showOpenDialog(options);

        // then
        const args = getDialogArgs(electronDialog.showOpenDialog);

        expect(args.defaultPath).to.equal(USER_DESKTOP_PATH);
      });


      it('should use specified defaultPath', async function() {

        // given
        const defaultPath = path.join(USER_PATH);

        electronDialog.setResponse([]);

        // when
        await dialog.showOpenDialog(assign({}, options, {
          defaultPath
        }));

        // then
        const args = getDialogArgs(electronDialog.showOpenDialog);

        expect(args.defaultPath).to.equal(defaultPath);
      });


      it('should set defaultPath when opening files', async function() {

        // given
        const fooPath = path.join(USER_PATH, 'foo', 'foo.file'),
              defaultPath = path.dirname(fooPath);

        const filePaths = [ fooPath ];

        electronDialog.setResponse(filePaths);

        // when
        await dialog.showOpenDialog(options);

        // then
        expect(config.get('defaultPath')).to.equal(defaultPath);
      });

    });

  });


  describe('#showSaveDialog', function() {

    const file = {
      name: 'foo'
    };

    const options = {
      filters: {
        name: 'foo',
        extensions: [ 'foo' ]
      },
      title: 'foo'
    };


    it('should return filepath', async function() {

      // given
      const filePath = 'foo';

      electronDialog.setResponse(filePath);

      // when
      const response = await dialog.showSaveDialog(assign({}, options, { file }));

      // then
      expect(response).to.eql(filePath);

      const args = getDialogArgs(electronDialog.showSaveDialog);

      expect(args).to.include(options);
    });


    it('should NOT return filepath', async function() {

      // when
      const response = await dialog.showSaveDialog(assign({}, options, { file }));

      // then
      expect(response).not.to.exist;

      const args = getDialogArgs(electronDialog.showSaveDialog);

      expect(args).to.include(options);
    });


    describe('defaultPath', function() {

      it('should use userDesktopPath by default', async function() {

        // when
        await dialog.showSaveDialog(assign({}, options, { file }));

        // then
        const args = getDialogArgs(electronDialog.showSaveDialog);

        expect(args.defaultPath).to.equal(`${ USER_DESKTOP_PATH }/${ file.name }`);
      });


      it('should use specified defaultPath', async function() {

        // given
        const defaultPath = path.join(USER_PATH);

        // when
        await dialog.showSaveDialog(assign({}, options, {
          defaultPath,
          file
        }));

        // then
        const args = getDialogArgs(electronDialog.showSaveDialog);

        expect(args.defaultPath).to.equal(`${ defaultPath }/${ file.name }`);
      });


      it('should set defaultPath when saving file', async function() {

        // given
        const fooPath = path.join(USER_PATH, 'foo', 'foo.file'),
              defaultPath = path.dirname(fooPath);

        electronDialog.setResponse(fooPath);

        // when
        await dialog.showSaveDialog(assign({}, options, { file }));

        // then
        expect(config.get('defaultPath')).to.equal(defaultPath);
      });

    });

  });

});

// helpers //////////

function getDialogArgs(method) {
  return method.args[0][1];
}