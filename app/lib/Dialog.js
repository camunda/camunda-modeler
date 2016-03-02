'use strict';

var path = require('path');

var map = require('lodash/collection/map');

var filterExtensions = require('./util/filter-extensions'),
    ensureOptions = require('./util/ensure-opts');

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


Dialog.prototype.getDialogOptions = function(type, opts) {
  var config = this.config,
      userDesktopPath = this.userDesktopPath;

  var defaultPath = config.get('defaultPath', userDesktopPath);


  this._dialogs = {
    open: function() {
      return {
        title: 'Open diagram',
        defaultPath: defaultPath,
        properties: [ 'openFile', 'multiSelections' ],
        filters: filterExtensions([ 'supported', 'bpmn', 'dmn', 'all' ])
      };
    },
    save: function(options) {
      ensureOptions([ 'name', 'fileType' ], options);

      return {
        title: 'Save ' + options.name + ' as..',
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
          { id: 'close', label: 'Don\'t Save'}
        ]
      };
    },
    importError: function(options) {
      ensureOptions([ 'name', 'trace' ], options);

      return {
        type: 'error',
        title: 'Importing Error',
        buttons: [
          { id: 'cancel', label: 'Close' },
          { id: 'forum', label: 'Forum' },
          { id: 'issue-tracker', label: 'Issue Tracker' }
        ],
        message: 'Ooops, we could not display this diagram!',
        detail: [
          'Do you believe "' + options.name + '" is valid BPMN or DMN diagram?',
          'If so, please consult our forum or file an issue in our issue tracker.',
          '',
          options.trace
        ].join('\n')
      };
    },
    unrecognizedFile: function(options) {
      ensureOptions([ 'name' ], options);

      return {
        type: 'warning',
        title: 'Unrecognized file format',
        buttons: [
          { id: 'cancel', label: 'Close' }
        ],
        message: 'The file "' + options.name + '" is not a BPMN or DMN file.'
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
        message: 'The file "' + options.name + '" already exists. Do you want to overwrite it ?'
      };
    },
    namespace: function() {
      return {
        type: 'warning',
        title: 'Deprecated <activiti> namespace detected',
        buttons: [
          { id: 'cancel', label: 'Cancel' },
          { id: 'no', label: 'No' },
          { id: 'yes', label: 'Yes' }
        ],
        message: 'Would you like to convert your diagram to the <camunda> namespace?',
        detail: [
          'This will allow you to maintain execution related properties.',
          '',
          '<camunda> namespace support works from Camunda BPM versions 7.4.0, 7.3.3, 7.2.6 onwards.'
        ].join('\n')
      };
    }
  };

  return this._dialogs[type](opts);
};

Dialog.prototype.setDefaultPath = function(filenames) {
  var config = this.config,
      defaultPath,
      dirname;

  if (Array.isArray(filenames)) {
    defaultPath = filenames[0];
  } else {
    defaultPath = filenames;
  }

  if (this.defaultPath && this.defaultPath === defaultPath) {
    return this.defaultPath;
  }

  dirname = path.dirname(defaultPath);

  config.set('defaultPath', dirname);

  this.defaultPath = dirname;

  return filenames;
};

Dialog.prototype.showDialog = function(type, opts) {
  var dialog = this.dialog,
      dialogOptions = this.getDialogOptions(type, opts),
      buttons = dialogOptions.buttons,
      filenames,
      result;

  // windows needs this property
  dialogOptions.noLink = true;

  if (dialogOptions.buttons) {
    dialogOptions.buttons = map(buttons, function(button) {
      return button.label;
    });
  }

  if (type === 'open') {
    filenames = dialog.showOpenDialog(dialogOptions);
  } else
  if (type === 'save') {
    filenames = dialog.showSaveDialog(dialogOptions);
  } else {
    result = dialog.showMessageBox(dialogOptions);

    // get the button ID according to the result
    result = buttons[result].id;
  }

  // save last used path to config
  if (filenames) {
    result = this.setDefaultPath(filenames);
  }

  return result;
};


Dialog.prototype.showGeneralErrorDialog = function() {
  var dialog = this.dialog;

  dialog.showErrorBox('Error', 'There was an internal error.' + '\n' + 'Please try again.');
};
