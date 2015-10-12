'use strict';

var assign = require('lodash/object/assign');

var once = require('lodash/function/once');


/**
 * Wait until IO is ready for writing
 *
 * @param {Writer} writer
 * @param {Function} done
 */
function whenReady(writer, done) {
  // set a watchdog to avoid eventual locking:
  var start = Date.now();

  // wait for a few seconds
  function reentrant() {

    if (writer.readyState === writer.WRITING && Date.now() - start < 4000) {
      return setTimeout(reentrant, 100);
    }

    if (writer.readyState === writer.WRITING) {
      writer.abort();
      return done(new Error('timeout waiting for io (readyState is ' + writer.readyState + ')'));
    }

    return done();
  }

  setTimeout(reentrant, 100);
}


/**
 * Writes a given file entry with the passed blob
 */
function writeFile(fileEntry, blob, done) {

  if (!fileEntry) {
    return done(new Error('no writable entry'));
  }

  if (!blob) {
    return done(new Error('no data given'));
  }

  // make sure done is only called once
  // (important in case of errors!)
  done = once(done);

  // retrieve a writeable file to work with
  // (during drag'n'drop file entries are read-only)
  chrome.fileSystem.getWritableEntry(fileEntry, function(writableEntry) {

    writableEntry.createWriter(function(writer) {

      writer.onerror = function(err) {
        console.error('write error');
        console.error(err);

        return done(err);
      };

      writer.truncate(blob.size);
      whenReady(writer, function(err) {

        if (err) {
          return done(err);
        }

        writer.seek(0);

        writer.onwriteend = function() {
          return done(null);
        };

        writer.write(blob);
      });
    }, done);
  });
}


function readFileAsText(fileEntry, done) {

  fileEntry.file(function(file) {
    var reader = new FileReader();

    reader.onerror = done;
    reader.onload = function(e) {
      done(null, e.target.result);
    };

    reader.readAsText(file);
  });
}


function DiagramFile(entry, contents, path) {
  this.contents = contents;
  this.entry = entry;
  this.name = entry.name;
  this.path = path;
}


/**
 * Load a file entry from the local disk to a diagram file
 */
function loadFile(entry, done) {

  entry.file(function(file) {
    readFileAsText(entry, function(err, contents) {
      if (err) {
        return done(err);
      }

      chrome.fileSystem.getDisplayPath(entry, function(path) {
        return done(null, new DiagramFile(entry, contents, path));
      });
    });
  });
}


function chooseEntry(options, done) {

  try {
    chrome.fileSystem.chooseEntry(options, function(entry) {
      if (chrome.runtime.lastError) {
        // user canceled?
      }

      return done(null, entry);
    });
  } catch (err) {
    return done(null);
  }
}

function openFile(done) {

  var accepts = [ {
    mimeTypes: [ 'text/*' ],
    extensions: [ 'bpmn', 'xml' ]
  } ];

  chooseEntry({ type: 'openFile', accepts: accepts }, function(err, entry) {
    if (err || !entry) {
      return done(err);
    }

    loadFile(entry, done);
  });
}

/**
 * Save the given diagram file
 *
 * @param {DiagramFile} diagramFile
 * @param {Object} [options]
 * @param {Boolean} [options.create=false]
 *
 * @param {Function} done
 */
function saveFile(diagramFile, options, done) {

  if (typeof options === 'function') {
    done = options;
    options = {};
  }

  var create = options.create;

  var blob = new Blob([ diagramFile.contents ], { type: 'text/plain' });

  if (diagramFile.entry && create !== true) {
    // save existing file
    writeFile(diagramFile.entry, blob, done);
  } else {
    // choose new file to save
    chooseEntry({ type: 'saveFile', suggestedName: diagramFile.name }, function(err, entry) {
      if (err) {
        return done(err);
      }

      if (!entry) {
        return done(new Error('no entry choosen'));
      }

      writeFile(entry, blob, function(err) {

        if (err) {
          return done(err);
        }

        chrome.fileSystem.getDisplayPath(entry, function(path) {
          diagramFile.entry = entry;
          diagramFile.name = entry.name;
          diagramFile.path = path;

          return done();
        });
      });
    });
  }
}

module.exports.loadFile = loadFile;

module.exports.openFile = openFile;

module.exports.saveFile = saveFile;
