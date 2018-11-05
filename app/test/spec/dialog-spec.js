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
      dialog: electronDialog,
      config: config,
      userDesktopPath: USER_DESKTOP_PATH
    });
  });


  it('should show save dialog', function(done) {

    // given
    var newBasePath = path.join(USER_PATH, 'dmn'),
        newPath = path.join(newBasePath, 'diagram_1.dmn'),
        saveDialogArg;

    electronDialog.setResponse(newPath);

    // when
    dialog.showDialog('save', {
      name: 'diagram_1.dmn',
      fileType: 'dmn'
    }, function(err, saveResult) {
      saveDialogArg = getDialogArgs(electronDialog.showSaveDialog);

      // then
      expect(saveResult).to.equal(newPath);

      expect(electronDialog.showSaveDialog).to.have.been.called;

      expect(saveDialogArg.title).to.equal('Save diagram_1.dmn as...');
      expect(path.join(saveDialogArg.defaultPath)).to.equal(path.join(USER_DESKTOP_PATH, 'diagram_1.dmn'));

      done();
    });

  });


  it('should show message dialog -> close', function(done) {

    // given
    var messageBoxArg;

    electronDialog.setResponse(1);

    // when
    dialog.showDialog('close', {
      name: 'diagram_1.bpmn'
    }, function(err, closeResult) {
      messageBoxArg = getDialogArgs(electronDialog.showMessageBox);

      // then
      expect(closeResult).to.equal('save');

      expect(electronDialog.showMessageBox).to.have.been.called;

      expect(messageBoxArg.title).to.equal('Close diagram');
      expect(messageBoxArg.buttons).to.eql([ 'Cancel', 'Save', 'Don\'t Save' ]);

      done();
    });

  });


  it('should show general error dialog', function() {

    // given
    var title = 'Error',
        message = 'There was an internal error.' + '\n' + 'Please try again.';

    // when
    dialog.showGeneralErrorDialog();

    // then
    expect(electronDialog.showErrorBox).to.have.been.calledWith(title, message);
  });


  it('should set last used path to config via save', function(done) {

    // given
    var newPath = path.join(USER_PATH, 'dmn', 'diagram_1.dmn'),
        defaultPath = path.dirname(newPath);

    electronDialog.setResponse(newPath);

    // when
    dialog.showDialog('save', {
      name: 'diagram_1.dmn',
      fileType: 'dmn'
    }, function() {

      // then
      expect(config.get('defaultPath')).to.equal(defaultPath);

      done();
    });

  });


  describe('#showDialog', function() {

    it('should show error dialog', function(done) {

      // given
      electronDialog.setResponse(0);

      var options = {
        title: 'error',
        buttons: [{
          id: 'foo'
        }, {
          id: 'bar'
        }]
      };

      // when
      dialog.showDialog('error', options, function(err, result) {
        var dialogArgs = getDialogArgs(electronDialog.showMessageBox);

        // then
        expect(err).not.to.exist;

        expect(electronDialog.showMessageBox).to.have.been.called;

        expect(dialogArgs.title).to.equal('error');
        expect(dialogArgs.buttons).to.have.length(2);

        expect(result).to.equal('foo');

        done();
      });
    });


    it('should show warning dialog', function(done) {

      // given
      electronDialog.setResponse(0);

      var options = {
        title: 'warning',
        buttons: [{
          id: 'foo'
        }, {
          id: 'bar'
        }]
      };

      // when
      dialog.showDialog('warning', options, function(err, result) {
        var dialogArgs = getDialogArgs(electronDialog.showMessageBox);

        // then
        expect(err).not.to.exist;

        expect(electronDialog.showMessageBox).to.have.been.called;

        expect(dialogArgs.title).to.equal('warning');
        expect(dialogArgs.buttons).to.have.length(2);

        expect(result).to.equal('foo');

        done();
      });
    });


    it('should show info dialog', function(done) {

      // given
      electronDialog.setResponse(0);

      var options = {
        title: 'info',
        buttons: [{
          id: 'foo'
        }, {
          id: 'bar'
        }]
      };

      // when
      dialog.showDialog('info', options, function(err, result) {
        var dialogArgs = getDialogArgs(electronDialog.showMessageBox);

        // then
        expect(err).not.to.exist;

        expect(electronDialog.showMessageBox).to.have.been.called;

        expect(dialogArgs.title).to.equal('info');
        expect(dialogArgs.buttons).to.have.length(2);

        expect(result).to.equal('foo');

        done();
      });
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


    it('should return files', async function() {

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


    it('should NOT return files', async function() {

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
        await dialog.showOpenDialog(assign(options, {
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

});

// helpers //////////

function getDialogArgs(method) {
  return method.args[0][1];
}