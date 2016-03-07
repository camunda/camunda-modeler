'use strict';

var merge = require('lodash/object/merge'),
    bind = require('lodash/function/bind'),
    assign = require('lodash/object/assign'),
    find = require('lodash/collection/find'),
    filter = require('lodash/collection/filter'),
    map = require('lodash/collection/map'),
    debounce = require('lodash/function/debounce');

var inherits = require('inherits');

var BaseComponent = require('base/component'),
    MenuBar = require('base/components/menu-bar'),
    Tabbed = require('base/components/tabbed');

var MultiButton = require('base/components/buttons/multi-button'),
    Button = require('base/components/buttons/button'),
    Separator = require('base/components/buttons/separator');

var BpmnSupport = require('./tabs/bpmn'),
    DmnSupport = require('./tabs/dmn');

var EmptyTab = require('./tabs/empty-tab');

var Footer = require('./footer');

var ensureOpts = require('util/ensure-opts'),
    series = require('util/async/series'),
    isUnsaved = require('util/file/is-unsaved'),
    parseFileType = require('./util/parse-file-type'),
    namespace = require('./util/namespace'),
    fileDrop = require('./util/dom/file-drop');

var debug = require('debug')('app');


/**
 * The main application entry point
 */
function App(options) {

  ensureOpts([
    'logger',
    'events',
    'dialog',
    'fileSystem'
  ], options);

  BaseComponent.call(this, options);


  this.layout = {
    propertiesPanel: {
      open: false,
      width: 250
    },
    log: {
      open: false,
      height: 150
    }
  };

  var EXPORT_BUTTONS = {
    png: {
      id: 'png',
      action: this.compose('triggerAction', 'export-tab', { type: 'png' }),
      label: 'Export as PNG',
      icon: 'icon-picture',
      primary: true
    },
    jpeg: {
      id: 'jpeg',
      action: this.compose('triggerAction', 'export-tab', { type: 'jpeg' }),
      label: 'Export as JPEG'
    },
    svg: {
      id: 'svg',
      action: this.compose('triggerAction', 'export-tab', { type: 'svg' }),
      label: 'Export as SVG'
    }
  };

  this.menuEntries = [
    MultiButton({
      id: 'create',
      choices: [
        {
          id: 'create-bpmn-diagram',
          action: this.compose('triggerAction', 'create-bpmn-diagram'),
          label: 'Create new BPMN Diagram',
          icon: 'icon-new',
          primary: true
        },
        {
          id: 'create-dmn-diagram',
          action: this.compose('triggerAction', 'create-dmn-diagram'),
          label: 'Create new DMN Table'
        }
      ]
    }),
    Button({
      id: 'open',
      icon: 'icon-open',
      label: 'Open a Diagram',
      action: this.compose('triggerAction', 'open-diagram')
    }),
    Separator(),
    Button({
      id: 'save',
      icon: 'icon-save-normal',
      label: 'Save Diagram',
      action: this.compose('triggerAction', 'save')
    }),
    Button({
      id: 'save-as',
      icon: 'icon-save-as',
      label: 'Save Diagram as...',
      action: this.compose('triggerAction', 'save-as')
    }),
    Separator(),
    Button({
      id: 'undo',
      icon: 'icon-undo',
      label: 'Undo',
      action: this.compose('triggerAction', 'undo'),
      disabled: true
    }),
    Button({
      id: 'redo',
      icon: 'icon-redo',
      label: 'Redo',
      action: this.compose('triggerAction', 'redo'),
      disabled: true
    }),
    Separator(),
    MultiButton({
      id: 'export-as',
      disabled: true,
      choices: map(EXPORT_BUTTONS, function(btn) {
        return btn;
      })
    })
  ];

  this.tabs = [
    EmptyTab({
      id: 'empty-tab',
      label: '+',
      title: 'Create new Diagram',
      action: this.compose('triggerAction', 'create-bpmn-diagram'),
      closable: false,
      app: this,
      events: this.events
    })
  ];

  this.activeTab = this.tabs[0];


  this.events.on('workspace:changed', debounce(() => {
    this.persistWorkspace(function(err) {
      debug('workspace persisted?', err);
    });
  }, 100));


  this.events.on('tools:state-changed', (tab, newState) => {

    var button;

    if (this.activeTab !== tab) {
      debug('Warning: state updated on incative tab! This should never happen!');
      return;
    }

    // update undo/redo/export based on state
    [ 'undo', 'redo' ].forEach((key) => {
      this.updateMenuEntry(key, !newState[key]);
    });

    debug('tools:state-changed', newState);

    // update export button state
    button = find(this.menuEntries, { id: 'export-as' });

    button.choices = (newState['exportAs'] || []).map((type) => {
      return EXPORT_BUTTONS[type];
    });

    if (button.choices.length) {
      button.disabled = false;
      button.choices[0] = assign({}, button.choices[0], { icon: 'icon-picture', primary: true });
    } else {
      button.disabled = true;
      button.choices[0] = { icon: 'icon-picture', primary: true, label: 'Export as Image' };
    }


    // tab dirty state
    tab.dirty = newState.dirty;

    // save and saveAs buttons
    // should work all the time as long as the
    // tab provides a save action
    [ 'save', 'save-as' ].forEach((key) => {
      var enabled = 'save' in newState;

      this.updateMenuEntry(key, !enabled);
    });

    this.events.emit('changed');
  });

  this.events.on('log:toggle', (options) => {

    var open = options && options.open;

    if (typeof open === 'undefined') {
      open = !(this.layout.log && this.layout.log.open);
    }

    this.events.emit('layout:update', {
      log: {
        open: open
      }
    });
  });

  this.logger.on('changed', this.events.composeEmitter('changed'));

  this.events.on('layout:update', newLayout => {
    this.layout = merge(this.layout, newLayout);

    this.events.emit('changed');
  });

  ///////// public API yea! //////////////////////////////////////

  /**
   * Listen to an app event
   *
   * @param {String} event
   * @param {Function} callbackFn
   */
  this.on = bind(this.events.on, this.events);

  /**
   * Emit an event via the app
   *
   * @param {String} event
   * @param {Object...} additionalArgs
   */
  this.emit = bind(this.events.emit, this.events);


  // bootstrap support for diagram files

  this.createComponent(BpmnSupport, { app: this });
  this.createComponent(DmnSupport, { app: this });
}

inherits(App, BaseComponent);

module.exports = App;


App.prototype.render = function() {
  var html =
    <div className="app" onDragover={ fileDrop(this.compose('filesDropped')) }>
      <MenuBar entries={ this.menuEntries } />
      <Tabbed
        className="main"
        tabs={ this.tabs }
        active={ this.activeTab }
        onSelect={ this.compose('selectTab') }
        onClose={ this.compose('closeTab') } />
      <Footer
        layout={ this.layout }
        log={ this.logger }
        events={ this.events } />
    </div>;

  return html;
};

/**
 * Create new application component with wired globals.
 *
 * @param {Function} Component constructor
 * @param {Object} [options]
 *
 * @return {Object} component instance
 */
App.prototype.createComponent = function(Component, options) {

  var actualOptions = assign(options || {}, {
    events: this.events,
    layout: this.layout,
    logger: this.logger,
    dialog: this.dialog
  });

  return new Component(actualOptions);
};

/**
 * Open a new tab based on a file chosen by the user.
 */
App.prototype.openDiagram = function() {

  var dialog = this.dialog;

  dialog.open((err, files) => {
    if (err) {
      dialog.openError(err, function() {
        debug('open-diagram canceled: %s', err);
      });

      return;
    }

    if (!files) {
      debug('open-diagram canceled: no file');

      return;
    }

    series(files, (file, done) => {
      var type = parseFileType(file);

      if (!type) {
        dialog.unrecognizedFileError(file, function(err) {
          debug('open-diagram canceled: unrecognized file type', file);

          return done(err);
        });

      } else {
        if (namespace.hasActivitiURL(file.contents)) {

          dialog.convertNamespace((err, answer) => {
            if (err) {
              debug('open-diagram error: %s', err);

              return done(err);
            }

            if (isCancel(answer)) {
              return done(null);
            }

            if (answer === 'yes') {
              file.contents = namespace.replace(file.contents);
            }

            done(null, assign(file, { fileType: type }));
          });
        } else {
          done(null, assign(file, { fileType: type }));
        }
      }
    }, (err, diagramFiles) => {
      if (err) {
        return debug('open-diagram canceled: %s', err);
      }

      diagramFiles = filter(diagramFiles, (file) => {
        return !!file;
      });

      this.createTabs(diagramFiles);
    });
  });
};

App.prototype.triggerAction = function(action, options) {

  debug('trigger-action', action, options);

  var activeTab = this.activeTab;

  if (action === 'create-bpmn-diagram') {
    return this.createDiagram('bpmn');
  }

  if (action === 'create-dmn-diagram') {
    return this.createDiagram('dmn');
  }

  if (action === 'close-active-tab') {

    if (activeTab.closable) {
      return this.closeTab(this.activeTab);
    }

    return;
  }

  if (action === 'open-diagram') {
    return this.openDiagram();
  }

  // handle special actions
  if (action === 'save') {
    return this.saveTab(activeTab);
  }

  if (action === 'save-as') {
    return this.saveTab(activeTab, { saveAs: true });
  }

  if (action === 'export-tab') {
    return this.exportTab(activeTab, options.type);
  }

  // forward other actions to active tab
  activeTab.triggerAction(action, options);
};

/**
 * Create diagram of the specific type.
 *
 * @param {String} type
 */
App.prototype.createDiagram = function(type) {
  this.events.emit('create-diagram', type);
};


/**
 * Create tabs for the given files and select the last tab.
 *
 * @param {Array<File>} files
 */
App.prototype.createTabs = function(files) {
  var lastFile;

  if (!Array.isArray(files)) {
    files = [ files ];
  }

  if (!files.length) {
    return;
  }

  lastFile = files[files.length - 1];

  files.forEach(file => {

    this.createTab(file, {
      select: file === lastFile,
      dirty: file.path === '[unsaved]'
    });
  });
};

/**
 * Create a new tab from the given file.
 *
 * @param {File} file
 * @param {Object} options
 */
App.prototype.createTab = function(file, options) {
  this.events.emit('create-tab', file, options);
};

/**
 * Export the given tab with an image type.
 *
 * @param {Tab} tab
 * @param {String} [type]
 * @param {Function} [done]
 */
App.prototype.exportTab = function(tab, type, done) {
  if (!tab) {
    throw new Error('need tab to save');
  }

  if (!tab.save) {
    throw new Error('tab cannot #save');
  }

  done = done || function(err, suggestedFile) {
    if (err) {
      debug('export canceled: %s', err);
    } else {
      debug('exported %s \n%s', tab.id, suggestedFile.contents);
    }
  };

  tab.exportAs(type, (err, file) => {
    if (err) {
      debug('export error! %s', err);

      return done(err);
    }

    this._saveTab(tab, file, true, done);
  });
};

/**
 * Save the given tab with optional new name and
 * path (passed via options).
 *
 * @param {Tab} tab
 * @param {Object} [options]
 * @param {Function} [done]
 */
App.prototype.saveTab = function(tab, options, done) {

  var dialog = this.dialog;

  if (!tab) {
    throw new Error('need tab to save');
  }

  if (!tab.save) {
    throw new Error('tab cannot #save');
  }

  if (typeof options === 'function') {
    done = options;
    options = undefined;
  }

  done = done || function(err) {
    if (err) {
      dialog.saveError(err, function() {
        debug('error: %s', err);
      });
    }
  };

  var updateTab = (err, savedFile) => {

    if (err) {
      debug('not gonna update tab: %s', err);

      return done(err);
    }

    debug('saved %s', tab.id);

    // finally saved...
    tab.setFile(savedFile);

    this.events.emit('workspace:changed');

    return done(null, savedFile);
  };

  var saveAs;

  debug('saving %s', tab.id);

  tab.save((err, file) => {

    if (err) {
      return done(err);
    }

    debug('exported %s \n%s', tab.id, file.contents);

    saveAs = isUnsaved(file) || options && options.saveAs;

    this._saveTab(tab, file, saveAs, updateTab);
  });
};

App.prototype._saveTab = function(tab, file, saveAs, done) {
  var dialog = this.dialog,
      newFile;

  if (saveAs) {
    dialog.saveAs(file, (err, suggestedFile) => {

      if (!suggestedFile) {
        err = userCanceled();
      }

      if (err) {
        debug('save %s err', tab.id, err);
        return done(err);
      }

      debug('save %s as %s', tab.id, suggestedFile.path);

      newFile = assign({}, file, suggestedFile);

      this.saveFile(newFile, done);
    });
  } else {
    newFile = assign({}, file);

    this.saveFile(newFile, done);
  }
};

/**
 * Save the given file and invoke callback with (err, savedFile).
 *
 * @param {File} file
 * @param {Function} done
 */
App.prototype.saveFile = function(file, done) {
  this.fileSystem.writeFile(file, done);
};

App.prototype.filesDropped = function(files) {

  var dialog = this.dialog;

  function withType(file) {
    var type = parseFileType(file);

    if (!type) {
      dialog.unrecognizedFileError(file, function() {
        debug('file drop rejected: unrecognized file type', file);
      });
    } else {
      return assign(file, { fileType: type });
    }
  }

  function withoutEmpty(f) {
    return f;
  }

  // parse type + filter unrecognized files
  var actualFiles = files.map(withType).filter(withoutEmpty);

  // create tabs for files
  this.createTabs(actualFiles);
};


/**
 * Select the given tab.
 *
 * @param {Tab} tab
 */
App.prototype.selectTab = function(tab) {
  debug('selecting tab with id: ' + tab.id);

  var exists = contains(this.tabs, tab);

  if (!exists) {
    throw new Error('non existing tab');
  }

  this.activeTab = tab;

  this.activeTab.emit('focus');

  this.logger.info('switch to <%s> tab', tab.id);

  this.events.emit('workspace:changed');
  this.events.emit('changed');
};

/**
 * Close the given tab.
 *
 * @param {Tab} tab
 */
App.prototype.closeTab = function(tab, done) {

  debug('close tab', tab);

  var tabs = this.tabs,
      dialog = this.dialog,
      file;

  var exists = contains(tabs, tab);

  if (!exists) {
    throw new Error('non existing tab');
  }

  if (!done || typeof done !== 'function') {
    done = function(err) {
      if (err) {
        debug('error: %s', err);
      }
    };
  }

  // close normally when file is already saved
  if (!tab.dirty) {
    return this._closeTab(tab, done);
  }

  file = tab.file;

  dialog.close(file, (err, answer) => {

    if (isCancel(answer)) {
      err = userCanceled();
    }

    if (err) {
      debug('close-tab canceled: %s', err);

      return done(err);
    }

    // close without saving
    if (answer === 'close') {
      return this._closeTab(tab, done);
    }

    // save and then close the tab
    this.saveTab(tab, (err, savedFile) => {
      if (err) {
        debug('save-tab error: %s', err);

        done(err);
        return;
      }

      this._closeTab(tab, done);
    });
  });
};

App.prototype._closeTab = function(tab, done) {
  var tabs = this.tabs,
      events = this.events;

  events.emit('tab:close', tab);

  var idx = tabs.indexOf(tab);

  // remove tab from selection
  tabs.splice(idx, 1);

  // if tab was active, select previous (if exists) or next tab
  if (tab === this.activeTab) {
    this.selectTab(tabs[idx - 1] || tabs[idx]);
  }

  events.emit('workspace:changed');

  events.emit('changed');

  done(null, tab);
};

App.prototype.addTab = function(tab, config) {

  var tabs = this.tabs,
      events = this.events;

  tabs.splice(tabs.length - 1, 0, tab);

  events.emit('tab:add', tab);

  if (config && config.select) {
    this.selectTab(tab);
  }

  events.emit('workspace:changed');
  events.emit('changed');
};

/**
 * Persist the current workspace state
 *
 * @param {Function} done
 */
App.prototype.persistWorkspace = function(done) {

  var config = {
    tabs: [],
    activeTab: -1
  };

  // store tabs
  this.tabs.forEach((tab, idx) => {

    var file = tab.file;

    // do not persist unsaved files
    if (!file || file.path === '[unsaved]') {
      return;
    }

    config.tabs.push({
      name: file.name,
      contents: file.contents,
      path: file.path,
      fileType: file.fileType
    });

    // store saved active tab index
    if (tab === this.activeTab) {
      config.activeTab = config.tabs.length - 1;
    }
  });

  // store layout
  config.layout = this.layout;

  // let others store stuff, too
  this.events.emit('workspace:persist', config);

  // actually save
  this.workspace.save(config, (err, config) => {
    this.events.emit('workspace:persisted', err, config);

    done(err, config);
  });
};

/**
 * Restore previously saved workspace, if any exists.
 *
 * @param {Function} done
 */
App.prototype.restoreWorkspace = function(done) {

  var defaultConfig = {
    tabs: [],
    layout: {
      propertiesPanel: {
        open: false,
        width: 250
      },
      log: {
        open: false,
        height: 150
      }
    }
  };

  this.workspace.load(defaultConfig, (err, config) => {

    if (err) {
      debug('workspace load error', err);

      return done(err);
    }

    // restore tabs
    if (config.tabs) {
      this.createTabs(config.tabs);
    }

    if (config.activeTab !== undefined) {
      this.activeTab = this.tabs[config.activeTab];
    }

    this.events.emit('changed');

    this.events.emit('workspace:restored');

    // we are done
    done(null, config);
  });

};


/**
 * Enables/disables any (button) menu entries
 *
 * @param  {String} id
 * @param  {Boolean} isDisabled
 */
App.prototype.updateMenuEntry = function (id, isDisabled) {
  var button = find(this.menuEntries, { id: id });

  button.disabled = isDisabled;

  this.events.emit('changed');
};

/**
 * Start application.
 */
App.prototype.run = function() {

  this.selectTab(this.tabs[0]);

  this.restoreWorkspace(function(err) {
    if (err) {
      debug('workspace restore error', err);
    } else {
      debug('workspace restored');
    }
  });
  this.events.emit('changed');
};


function contains(collection, element) {
  return collection.some(function(e) {
    return e === element;
  });
}

function isCancel(userChoice) {
  return userChoice === 'cancel';
}

function userCanceled() {
  return new Error('user canceled');
}