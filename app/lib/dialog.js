'use strict';

var path = require('path');

var {
  map
} = require('min-dash');

var filterExtensions = require('./util/filter-extensions'),
    ensureOptions = require('./util/ensure-opts');

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
  var config = this.config,
      userDesktopPath = this.userDesktopPath,
      defaultPath;

  // filepath is passed if a saved file is focused
  if (options && options.filePath) {
    defaultPath = path.dirname(options.filePath);
  } else {
    defaultPath = config.get('defaultPath', userDesktopPath);
  }

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
    exportAs: function(options) {
      ensureOptions([ 'name', 'filters' ], options);

      return {
        title: 'Export ' + options.name + ' as...',
        defaultPath: defaultPath + '/' + options.name,
        filters: options.filters
      };
    },
    save: function(options) {
      ensureOptions([ 'name', 'fileType' ], options);

      return {
        title: 'Save ' + options.name + ' as...',
        defaultPath: defaultPath + '/' + options.name,
        filters: filterExtensions([ options.fileType, 'all' ])
      };
    },
    close: function(options) {
      ensureOptions([ 'name' ], options);

      return {
        title: 'Close diagram',
        message: 'Save changes to ' + options.name + ' before closing?',
        type: 'question',
        buttons: [
          { id: 'cancel', label: 'Cancel' },
          { id: 'save', label: 'Save' },
          { id: 'discard', label: 'Don\'t Save' }
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
    namespace: function(options) {
      var oldNs = '',
          newNs = '',
          details = [];

      ensureOptions([ 'type' ], options);

      if (options.type === 'bpmn') {
        oldNs = '<activiti>';
        newNs = '<camunda>';

        details = [
          'This will allow you to maintain execution related properties.',
          '',
          '<camunda> namespace support works from Camunda BPM versions 7.4.0, 7.3.3, 7.2.6 onwards.'
        ];
      }

      if (options.type === 'dmn') {
        oldNs = 'DMN';
        newNs = 'new DMN';
      }

      return {
        type: 'warning',
        title: 'Deprecated ' + oldNs + ' namespace detected',
        buttons: [
          { id: 'cancel', label: 'Cancel' },
          { id: 'no', label: 'No' },
          { id: 'yes', label: 'Yes' }
        ],
        message: 'Would you like to convert your diagram to the ' + newNs + ' namespace?',
        detail: details.join('\n')
      };
    },
    savingDenied: function(options) {
      return {
        type: 'warning',
        title: 'Cannot save file',
        buttons: [
          { id: 'cancel', label: 'Cancel' },
          { id: 'save-as', label: 'Save File as..' }
        ],
        message: [
          'We cannot save or overwrite the current file.',
          'Do you want to save the file as.. ?'
        ].join('\n')
      };
    },
    error: getDialog('error'),
    warning: getDialog('warning'),
    info: getDialog('info')
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
        this.setDefaultPath(filePaths);
      }

      resolve(filePaths);
    });
  });
};

Dialog.prototype.showSaveDialog = function() {
  // TODO(philippfromme): implement
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