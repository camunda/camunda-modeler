'use strict';

var slice = require('util/slice');

var debug = require('debug')('file-drop');

var domify = require('domify');

var every = require('lodash/collection/every');

var OVERLAY_HTML = '<div class="drop-overlay">' +
                     '<div class="box">' +
                        '<div>Drop diagrams here</div>' +
                     '</div>' +
                   '</div>';

/**
 * Add file drop functionality to the given element,
 * calling fn(files...) on drop.
 *
 * @example
 *
 * <div onDragover={ fileDrop(handleFiles) }></div>
 *
 * @param {Function} fn
 *
 * @return {Function} drag start callback function
 */
function fileDrop(fn) {

  var self;
  var extraArgs;

  var overlay;


  /** handle actual drop */
  function onDrop(event) {

    event.preventDefault();

    asyncMap(event.dataTransfer.files, readFile, function(err, files) {

      if (err) {
        debug('file drop failed', err);
      } else {

        debug('file drop', files);

        var args = extraArgs.concat([ files, event ]);

        // cleanup on drop
        // onEnd(event);

        // call provided fn with extraArgs..., files, event
        fn.apply(self, args);
      }
    });
  }

  function isDragAllowed(dataTransfer) {

    if (!dataTransfer || !dataTransfer.items.length) {
      return false;
    }

    return every(dataTransfer.items, function(item) {
      return item.type === 'file' || item.kind === 'file';
    });
  }

  /** drag over */
  var onDragover = function onDragover() {

    // (0) extract extra arguments (extraArgs..., event)
    var args = slice(arguments),
        event = args.pop();

    var dataTransfer = event.dataTransfer,
        target = event.target;

    if (!isDragAllowed(dataTransfer)) {
      return;
    }

    // make us a drop zone
    event.preventDefault();

    dataTransfer.dropEffect = 'copy';

    // only register if we do not drag and drop already
    if (overlay) {
      return;
    }

    overlay = domify(OVERLAY_HTML);

    document.body.appendChild(overlay);


    self = this;
    extraArgs = args;


    // do not register events during testing
    if (!target) {
      return;
    }

    // (2) setup drag listeners

    // detach on end
    var onEnd = function(event) {

      // prevent defaults, i.e. native browser drop
      event.preventDefault();

      target.removeEventListener('drop', onDrop);
      target.removeEventListener('dragleave', onEnd);
      target.removeEventListener('dragend', onEnd);
      target.removeEventListener('drop', onEnd);

      if (overlay) {
        document.body.removeChild(overlay);
        overlay = null;
      }
    };

    // attach drag + cleanup event
    target.addEventListener('drop', onDrop);
    target.addEventListener('dragleave', onEnd);
    target.addEventListener('dragend', onEnd);
    target.addEventListener('drop', onEnd);
  };

  onDragover.onDrop = onDrop;

  return onDragover;
}

module.exports = fileDrop;


function readFile(dropFile, done) {

  if (!window.FileReader) {
    return done();
  }

  var reader = new FileReader();

  // Closure to capture the file information.
  reader.onload = function(e) {

    done(null, {
      name: dropFile.name,
      path: dropFile.path,
      contents: e.target.result
    });
  };

  reader.onerror = function(event) {
    done(event.target.error);
  };

  // Read in the image file as a data URL.
  reader.readAsText(dropFile);
}


function asyncMap(elements, iterator, done) {

  var idx = 0,
      results = [];

  function next() {

    if (idx === elements.length) {
      done(null, results);
    } else {

      iterator(elements[idx], function(err, result) {

        if (err) {
          return done(err);
        } else {
          results[idx] = result;
          idx++;

          next();
        }
      });
    }
  }

  next();
}
