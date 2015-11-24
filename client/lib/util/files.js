'use strict';

var browser = require('./browser');

var pick = require('lodash/object/pick');


// As long as we are using Angular, we need to give it a timeframe (delay) to update itself
// before showing any kind of dialogs. The reason for this is that the dialogs are synchronous
// and they don't allow the client side to render itself while being shown.
var SET_TIMEOUT_DELAY = 100;


function copyDiagram(diagramFile) {
  return pick(diagramFile, [ 'path', 'name', 'contents', 'notation' ]);
}

/**
 * Open a diagram file.
 *
 * @param {Function} callback
 */
function openFile(callback) {
  setTimeout(function() {
    browser.send('file.open', callback);
  }, SET_TIMEOUT_DELAY);
}

module.exports.openFile = openFile;

/**
 * Add a diagram file from a path (drag and drop).
 *
 * @param {Function} callback
 */
function addFile(filePath, callback) {
  setTimeout(function() {
    browser.send('file.add', [ filePath ], callback);
  }, SET_TIMEOUT_DELAY);
}

module.exports.addFile = addFile;


/**
 * Close a diagram file.
 *
 * @param {Diagram} diagramFile
 * @param {Function} callback
 */
function closeFile(diagramFile, callback) {
  setTimeout(function() {
    browser.send('file.close', [ diagramFile ], callback);
  }, SET_TIMEOUT_DELAY);
}

module.exports.closeFile = closeFile;

/**
 * Save a diagram file.
 *
 * @param  {Diagram}  diagramFile
 * @param  {Object}   options
 * @param  {Function} callback
 */
function saveFile(diagramFile, options, callback) {
  var diagram = copyDiagram(diagramFile);

  setTimeout(function() {
    browser.send('file.save', [ options.create, diagram ], function(err, updatedDiagram) {
      if (err) {
        return callback(err);
      }

      diagramFile.name = updatedDiagram.name;
      diagramFile.path = updatedDiagram.path;

      callback(err, diagramFile);
    });
  }, SET_TIMEOUT_DELAY);
}

module.exports.saveFile = saveFile;

/**
 * Sends a list of unsaved diagrams so the user can have
 * the choice of saving them before quitting.
 *
 * @param {Array} diagrams
 * @param {Function} callback
 */
function quitEditor() {
  setTimeout(function() {
    browser.send('editor.quit', function() {});
  }, SET_TIMEOUT_DELAY);
}

module.exports.quitEditor = quitEditor;


/**
 * Sends an error message and a callback function
 *
 * @param {DiagramFile} diagramFile
 * @param {String}   message
 * @param {Function} callback
 */
function importError(diagramFile, message, callback) {
  setTimeout(function() {
    browser.send('editor.import.error', [ copyDiagram(diagramFile), message ], callback);
  }, SET_TIMEOUT_DELAY);
}

module.exports.importError = importError;
