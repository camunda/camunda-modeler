'use strict';

var browser = require('./browser');

var pick = require('lodash/object/pick'),
    forEach = require('lodash/collection/forEach');


function save(config, callback) {

  var diagrams = config.diagrams;

  var workspace = {
    activeIdx: 0
  };

  workspace.diagrams = diagrams
    .map(function(diagram) {
      return pick(diagram, [ 'name', 'path', 'contents', 'notation' ]);
    })
    .filter(function(diagram) {
      if (diagram.path !== '[unsaved]') {
        return true;
      }
    });

  forEach(workspace.diagrams, function(diagram, idx) {
    if (diagram.name === config.currentDiagram.name) {
      workspace.activeIdx = idx;
    }
  });

  console.debug('[workspace]', 'save', workspace);

  browser.send('workspace.save', [ workspace ], callback);
}

module.exports.save = save;


function restore(callback) {
  browser.send('workspace.restore', function(err, workspace) {
    if (err) {
      return callback(err);
    }

    workspace.currentDiagram = workspace.diagrams[workspace.activeIdx];

    delete workspace.activeIdx;

    callback(null, workspace);
  });
}

module.exports.restore = restore;
