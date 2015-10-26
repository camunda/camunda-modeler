'use strict';

var browser = require('./browser');

// module.exports.loadFile = loadFile;


/**
 * Opens a diagram file.
 * @method openFile
 * @param {Function} callback
 */
function openFile(callback) {
  browser.send('file.open', callback);
}

module.exports.openFile = openFile;


/**
 * Save a diagram file.
 *
 * @param  {Diagram}   diagramFile
 * @param  {Object}   options
 * @param  {Function} callback
 */
function saveFile(diagramFile, options, callback) {
  var diagram = {
    path: diagramFile.path,
    contents: diagramFile.contents
  };

  browser.send('file.save', [ options.create, diagram ], function(err, updatedDiagram) {
    if (err) {
      return callback(err);
    }

    diagramFile.name = updatedDiagram.name;
    diagramFile.path = updatedDiagram.path;

    callback(err, diagramFile);
  });
}

module.exports.saveFile = saveFile;
