'use strict';

var dialog = require('dialog');

var Menus = require('../Menus');

var FileAssociations = require('./FileAssociations'),
    parseUtil = require('../../util/parse');

var FILE_ASSOCIATION_KEY = 'fileAssociation';


function WindowsPlatform(app, config) {

  // close handling
  app.on('window-all-closed', function () {
    app.quit();
  });

  // setup file associations + deferred open file
  // specified via command-line
  app.on('editor:open', function(browserWindow) {
    checkFileAssociations(app, config);
  });

  // editor menu
  app.on('editor:create-menu', function(mainWindow, notation) {
    var positions = {
      edit: 1
    };

    new Menus(mainWindow, notation, positions);
  });

  app.on('editor:add-recent', function(path) {
    app.addRecentDocument(path);
  });
}

module.exports = WindowsPlatform;


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

    if (err) {
      return console.error('[file association] failed to check', err);
    }

    if (associate) {

      associateEditor(executablePath, function(err) {
        if (err) {
          return console.error('[file association] failed to associate', err);
        }
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

function suggestFileAssociation(done) {
  dialog.showMessageBox({
    type: 'question',
    buttons: [ 'Yes', 'No' ],
    title: 'Camunda Modeler',
    message: 'Do you want to associate your .bpmn and .dmn files to the Camunda Modeler?'
  }, function(answer) {
    // return true, if the user agreed
    done(null, answer === 0);
  });
}
