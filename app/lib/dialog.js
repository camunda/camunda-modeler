'use strict';

const path = require('path');

const { map } = require('min-dash');

const ensureOptions = require('./util/ensure-opts');


/**
 * Interface for handling dialogs.
 *
 * @param  {Object} Options
 */
function Dialog(options) {
  ensureOptions([ 'dialog', 'config', 'userDesktopPath' ], options);

  this.dialog = options.dialog;
  this.config = options.config;

  this.userDesktopPath = options.userDesktopPath;
}

module.exports = Dialog;


Dialog.prototype.getDialogOptions = function(type, options) {
  const dialogs = {
    contentChanged: function() {
      return {
        title: 'File changed',
        message: 'The file has been changed externally.\nWould you like to reload it?',
        type: 'question',
        buttons: [
          { id: 'ok', label: 'Reload' },
          { id: 'cancel', label: 'Cancel' }
        ]
      };
    },
    existingFile: function(options) {
      ensureOptions([ 'name' ], options);

      return {
        type: 'warning',
        title: 'Existing file',
        buttons: [
          { id: 'cancel', label: 'Cancel' },
          { id: 'no-overwrite', label: 'No' },
          { id: 'overwrite', label: 'Overwrite' }
        ],
        message: 'The file "' + options.name + '" already exists. Do you want to overwrite it?'
      };
    },
    error: getDialog('error'),
    warning: getDialog('warning'),
    info: getDialog('info'),
    question: getDialog('question')
  };

  return dialogs[type](options);
};

Dialog.prototype.showDialog = function(type, opts, done) {
  var self = this;

  if (typeof opts === 'function') {
    done = opts;
    opts = undefined;
  }

  var dialog = this.dialog,
      browserWindow = this.browserWindow,
      dialogOptions = this.getDialogOptions(type, opts),
      buttons = dialogOptions.buttons;

  // windows needs this property
  dialogOptions.noLink = true;

  if (dialogOptions.buttons) {
    dialogOptions.buttons = map(buttons, function(button) {
      return button.label;
    });
  }

  done = done || function(err, result) {
    console.log(result);
  };

  function dialogCallback(answer) {
    var result;

    if (type !== 'open' && type !== 'save' && type !== 'exportAs') {
      // get the button ID according to the result
      result = buttons[answer].id;
    } else {
      result = answer;
    }

    // save last used path to config
    if (result && (type === 'open' || type === 'save' || type === 'exportAs')) {
      self.setDefaultPath(result);
    }

    done(null, result);
  }

  if (type === 'open') {
    dialog.showOpenDialog(browserWindow, dialogOptions, dialogCallback);

  } else
  if (type === 'save' || type === 'exportAs') {
    dialog.showSaveDialog(browserWindow, dialogOptions, dialogCallback);

  } else {
    dialog.showMessageBox(browserWindow, dialogOptions, dialogCallback);
  }
};

Dialog.prototype.showGeneralErrorDialog = function() {
  var dialog = this.dialog;

  dialog.showErrorBox(
    'Error',
    'There was an internal error.' + '\n' + 'Please try again.'
  );
};

Dialog.prototype.setActiveWindow = function(browserWindow) {
  this.browserWindow = browserWindow;
};

Dialog.prototype.showOpenFileErrorDialog = function(options) {
  const {
    detail,
    message,
    name
  } = options;

  return new Promise(resolve => {
    this.showDialog('error', {
      type: 'error',
      title: 'File Open Error',
      buttons: [
        { id: 'cancel', label: 'Close' }
      ],
      message: message || `Unable to open"${ name }"`,
      detail
    }, () => {
      resolve();
    });
  });
};

Dialog.prototype.showOpenDialog = function(options) {
  const {
    filters,
    title
  } = options;

  let { defaultPath } = options;

  if (!defaultPath) {
    defaultPath = this.config.get('defaultPath', this.userDesktopPath);
  }

  return new Promise(resolve => {
    this.dialog.showOpenDialog(this.browserWindow, {
      defaultPath,
      filters,
      properties: [ 'openFile', 'multiSelections' ],
      title: title || 'Open File'
    }, (filePaths = []) => {
      if (filePaths.length) {
        this.setDefaultPath(filePaths[0]);
      }

      resolve(filePaths);
    });
  });
};

Dialog.prototype.showSaveDialog = function(options) {
  const {
    file,
    filters,
    title
  } = options;

  let { name } = file;

  // remove extension
  name = path.parse(name).name;

  let { defaultPath } = options;

  if (!defaultPath) {
    defaultPath = this.config.get('defaultPath', this.userDesktopPath);
  }

  return new Promise(resolve => {
    this.dialog.showSaveDialog(this.browserWindow, {
      defaultPath: `${ defaultPath }/${ name }`,
      filters,
      title: title || `Save "${ name }" as...`
    }, (filePath) => {
      if (filePath) {
        this.setDefaultPath(filePath);
      }

      resolve(filePath);
    });
  });
};

Dialog.prototype.showMessageBox = function() {
  // TODO(philippfromme): implement
};

Dialog.prototype.setDefaultPath = function(filePaths) {
  let defaultPath;

  if (Array.isArray(filePaths)) {
    defaultPath = filePaths[0];
  } else {
    defaultPath = filePaths;
  }

  if (this.defaultPath && this.defaultPath === defaultPath) {
    return this.defaultPath;
  }

  const dirname = path.dirname(defaultPath);

  this.config.set('defaultPath', dirname);

  this.defaultPath = dirname;
};

// helpers //////////

function getDialog(type) {
  return function(options) {
    return {
      type: type,
      title: options.title,
      message: options.message,
      buttons: options.buttons,
      detail: options.detail
    };
  };
}