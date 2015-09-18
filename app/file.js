'use strict';

var fs = require('fs');
var ipc = require('ipc');

function File() {

  // Save
  ipc.on('text.save', function(evt, text) {
    this.save(text);
  }.bind(this));
}

File.prototype.get = function() {
  return this.filename;
};

File.prototype.set = function(filename) {
  this.filename = filename;
};

File.prototype.open = function open(browserWindow, filenames) {
  var md = fs.readFileSync(filenames[0], { encoding: 'utf8' });

  browserWindow.webContents.send('file.open', md);

  this.set(filenames[0]);
};

File.prototype.save = function save(text) {
  fs.writeFile(this.filename, text, { encoding: 'utf8' }, function(err) {
    if (err) {
      throw new Error(err);
    }
  });
};

module.exports = File;


// main() }
//     readFile() -> contents
//     analyzing if encrypted -> true/false
//     prompt for password -> returns password
//     encrypt the text -> returns encrypted text
//     write to file
// }
