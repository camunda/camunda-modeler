'use strict';

var path = require('path');

var Dialog = require('../../lib/dialog');

var ElectronDialog = require('../helper/mock/electron-dialog'),
    Config = require('../helper/mock/config');

var USER_PATH = '/users/bpmn.io/',
    USER_DESKTOP_PATH = path.join(USER_PATH, 'desktop');


function getDialogArgs(method) {
  return method.args[0][0];
}

describe('Dialog', function() {
  var dialog, electronDialog, config;

  beforeEach(function() {
    config = new Config(USER_PATH);
    electronDialog = new ElectronDialog();

    dialog = new Dialog({
      dialog: electronDialog,
      config: config,
      userDesktopPath: USER_DESKTOP_PATH
    });
  });


  it('should show open dialog', function() {
    // given
    var newBasePath = path.join(USER_PATH, 'bpmn'),
        newPath = path.join(newBasePath, 'diagram_1.bpmn'),
        openDialogArg,
        openResult;

    electronDialog.setResponse([newPath]);

    // when
    openResult = dialog.showDialog('open');

    openDialogArg = getDialogArgs(electronDialog.showOpenDialog);

    // then
    expect(openResult).to.contain(newPath);

    expect(electronDialog.showOpenDialog).to.have.been.called;

    expect(openDialogArg.title).to.equal('Open diagram');
    expect(openDialogArg.defaultPath).to.equal(USER_DESKTOP_PATH);
  });


  it('should show save dialog', function() {
    // given
    var newBasePath = path.join(USER_PATH, 'dmn'),
        newPath = path.join(newBasePath, 'diagram_1.dmn'),
        saveDialogArg,
        saveResult;

    electronDialog.setResponse(newPath);

    // when
    saveResult = dialog.showDialog('save', {
      name: 'diagram_1.dmn',
      fileType: 'dmn'
    });

    saveDialogArg = getDialogArgs(electronDialog.showSaveDialog);

    // then
    expect(saveResult).to.equal(newPath);

    expect(electronDialog.showSaveDialog).to.have.been.called;

    expect(saveDialogArg.title).to.equal('Save diagram_1.dmn as..');
    expect(path.join(saveDialogArg.defaultPath)).to.equal(path.join(USER_DESKTOP_PATH, 'diagram_1.dmn'));
  });


  it('should show message dialog -> close', function() {
    // given
    var messageBoxArg,
        closeResult;

    electronDialog.setResponse(1);

    // when
    closeResult = dialog.showDialog('close', {
      name: 'diagram_1.bpmn'
    });

    messageBoxArg = getDialogArgs(electronDialog.showMessageBox);

    // then
    expect(closeResult).to.equal('save');

    expect(electronDialog.showMessageBox).to.have.been.called;

    expect(messageBoxArg.title).to.equal('Close diagram');
    expect(messageBoxArg.buttons).to.eql([ 'Cancel', 'Save', 'Don\'t Save' ]);
  });


  it('should show general error dialog', function() {
    var title = 'Error',
        message = 'There was an internal error.' + '\n' + 'Please try again.';

    // when
    dialog.showGeneralErrorDialog();

    // then
    expect(electronDialog.showErrorBox).to.have.been.calledWith(title, message);
  });


  it('should set last used path to config via open', function() {
    // given
    var newPath = path.join(USER_PATH, 'bpmn', 'diagram_1.bpmn'),
        defaultPath = path.dirname(newPath);

    electronDialog.setResponse(newPath);

    // when
    dialog.showDialog('open');

    // then
    expect(config.get('defaultPath')).to.equal(defaultPath);
  });


  it('should set last used path to config via save', function() {
    // given
    var newPath = path.join(USER_PATH, 'dmn', 'diagram_1.dmn'),
        defaultPath = path.dirname(newPath);

    electronDialog.setResponse(newPath);

    // when
    dialog.showDialog('save', {
      name: 'diagram_1.dmn',
      fileType: 'dmn'
    });

    // then
    expect(config.get('defaultPath')).to.equal(defaultPath);
  });

});
