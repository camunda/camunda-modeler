'use strict';

var loadFile = require('./files').loadFile,
    asyncSeries = require('./async/series');


module.exports.restore = function(done) {

  chrome.storage.local.get('workspace', function(item) {

    var workspace = item.workspace;

    if (!workspace) {
      return done(null, { diagrams: [], active: null });
    }

    function restore(entry, done) {

      chrome.fileSystem.isRestorable(entry, function(restorable) {

        if (!restorable) {
          return done(null);
        }

        chrome.fileSystem.restoreEntry(entry, function(entry) {
          loadFile(entry, done);
        });
      });
    }

    asyncSeries(workspace.diagrams, restore, function(err, diagrams) {
      if (err) {
        return done(err);
      }

      var active = diagrams[ workspace.activeIdx ];

      diagrams = diagrams.filter(function(d) { return d; });

      if (!active) {
        active = diagrams[0];
      }

      var config = {
        diagrams: diagrams,
        active: active
      };

      return done(null, config);
    });

  });

};


module.exports.save = function(config) {

  var diagrams = config.diagrams;

  var diagramEntries = diagrams
        .map(function(d) {
          return d.entry ? chrome.fileSystem.retainEntry(d.entry) : null;
        })
        .filter(function(e) {
          return e;
        });

  var workspace = {
    activeIdx: diagrams.indexOf(config.active),
    diagrams: diagramEntries
  };

  chrome.storage.local.set({ workspace: workspace });
};


module.exports.getOpenEntry = function() {
  return launchData && launchData.items && launchData.items[0] && launchData.items[0].entry;
};
