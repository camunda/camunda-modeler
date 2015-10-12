'use strict';

var dialog = require('dialog');

var FileAssociations = require('./FileAssociations');

var FILE_ASSOCIATION_KEY = 'fileAssociation';


function WindowsIntegration(app, config) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });

  // check + setup file associations
  app.on('editor-open', function(browserWindow) {
    checkFileAssociations(app, config);
  });

  // editor menu
  app.on('editor-create-menu', function(mainWindow) {
    // TODO(nre): create
  });
}

module.exports = WindowsIntegration;


/**
 * Check application file associations and
 * initialize/update as needed.
 *
 * @param {ElectronApp} app
 * @param {Config} config
 */
function checkFileAssociations(app, config) {

  var executablePath = app.getPath('exe');

  var userChoice = config.get(FILE_ASSOCIATION_KEY);

  needsAssociation(userChoice, function(err, associate) {

    if (associate) {

      associateEditor(executablePath, function(err) {
        // haha, don't care
      });
    }

    config.set(FILE_ASSOCIATION_KEY, associate);
  });
}


function needsAssociation(existingChoice, done) {

  if (existingChoice !== undefined) {
    return done(null, existingChoice);
  } else {
    suggestFileAssociation(done);
  }
}

function associateEditor(executablePath, done) {

  try {
    FileAssociations.register(executablePath);
  } catch (e) {
    return done(e);
  }

  done(null);
}


function setupWindows(exePath) {
  /*
  var query = winUtil.queryRegistry().toString(),
      escapedExePath = exePath.replace(/\\/g, '\\\\');

  var hasExePath = new RegExp(escapedExePath, 'ig').test(query);
  var hasNoKey = new RegExp('The system was unable to find the specified registry key or value\.', 'gi').test(query);
  */
}

function suggestFileAssociation(done) {
  dialog.showMessageBox({
    type: 'question',
    buttons: [ 'Yes', 'No' ],
    title: 'Camunda Modeler',
    message: 'Do you want to associate your .bpmn files to the Camunda Modeler ?'
  }, function(answer) {
    // return true, if the user agreed
    done(null, answer === 0);
  });
}
