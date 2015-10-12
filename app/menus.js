'use strict';

// Electron Modules
const darwinMenu = require('./menus/darwin');
const linuxMenu = require('./menus/linux');


module.exports = function(browserWindow, desktopPath) {
  if (process.platform === 'darwin') {
    console.log('Loading OSX menu..');
    return darwinMenu(browserWindow, desktopPath);
  }
  
  if (process.platform === 'linux') {
    console.log('Loading Linux menu..');
    return linuxMenu(browserWindow, desktopPath);
  }
};
