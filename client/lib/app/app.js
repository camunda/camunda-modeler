'use strict';

var merge = require('lodash/object/merge'),
    bind = require('lodash/function/bind'),
    assign = require('lodash/object/assign'),
    find = require('lodash/collection/find'),
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

var ensureOpts = require('util/ensure-opts');

var isUnsaved = require('util/file/is-unsaved');

var parseFileType = require('./util/parse-file-type');

var fileDrop = require('./util/dom/file-drop');

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

  this.menuEntries = [
    MultiButton({
      id: 'create',
      choices: [
        {
          id: 'create-bpmn-diagram',
          action: this.compose('triggerAction', 'create-bpmn-diagram'),
          label: 'Create new BPMN diagram',
          icon: 'icon-new',
          primary: true
        },
        {
          id: 'create-dmn-diagram',
          action: this.compose('triggerAction', 'create-dmn-diagram'),
          label: 'Create new DMN diagram'
        }
      ]
    }),
    Button({
      id: 'open',
      icon: 'icon-open',
      action: this.compose('triggerAction', 'open-diagram')
    }),
    Separator(),
    Button({
      id: 'save',
      icon: 'icon-save-normal',
      action: this.compose('triggerAction', 'save')
    }),
    Button({
      id: 'save-as',
      icon: 'icon-save-as',
      action: this.compose('triggerAction', 'save-as')
    }),
    Separator(),
    Button({
      id: 'undo',
      icon: 'icon-undo',
      action: this.compose('triggerAction', 'undo'),
      disabled: true
    }),
    Button({
      id: 'redo',
      icon: 'icon-redo',
      action: this.compose('triggerAction', 'redo'),
      disabled: true
    })
  ];

  this.tabs = [
    EmptyTab({
      id: 'empty-tab',
      label: '+',
      title: 'Create new Diagram',
      action: this.compose('triggerAction', 'create-bpmn-diagram')
    })
  ];

  this.activeTab = this.tabs[0];

  this.events.on('tools:update-edit-state', (tab, newState) => {

    var button;

    // update buttons based on undo/redo state
    [ 'undo', 'redo' ].forEach((key) => {

      if (key in newState) {
        button = find(this.menuEntries, { id: key });
        button.disabled = !newState[key];

        this.events.emit('changed');
      }
    });

    if (tab === this.activeTab) {
      debug('update-edit-state', newState);

      button = find(this.menuEntries, { id: 'save' });

      tab.dirty = newState.dirty;
      button.disabled = !tab.dirty;

      this.events.emit('changed');
    }
  });

  this.events.on('log:toggle', () => {
    this.events.emit('layout:update', {
      log: {
        open: !(this.layout.log && this.layout.log.open)
      }
    });
  });

  this.logger.on('changed', this.events.composeEmitter('changed'));

  this.events.on('layout:update', newLayout => {
    this.layout = merge(this.layout, newLayout);

    this.events.emit('changed');
  });

  this.events.on('tab:select', tab => {

    var exists = contains(this.tabs, tab);

    if (!exists) {
      throw new Error('non existing tab');
    }

    this.activeTab = tab;

    this.logger.info('switch to <%s> tab', tab.id);

    this.events.emit('workspace:changed');

    this.events.emit('changed');
  });

  this.events.on('tab:close', tab => {
    debug('close tab', tab);

    var tabs = this.tabs,
        events = this.events;

    var exists = contains(tabs, tab);

    if (!exists) {
      return;
    }

    var idx = tabs.indexOf(tab);

    // remove tab from selection
    tabs.splice(idx, 1);

    // if tab was active, select previous (if exists) or next tab
    if (tab === this.activeTab) {
      events.emit('tab:select', tabs[idx - 1] || tabs[idx]);
    }

    events.emit('workspace:changed');

    events.emit('changed');
  });

  this.events.on('tab:add', (tab, config) => {

    var tabs = this.tabs,
        events = this.events;

    tabs.splice(tabs.length - 1, 0, tab);

    if (config && config.select) {
      events.emit('tab:select', tab);
    }

    events.emit('workspace:changed');
    events.emit('changed');
  });

  this.events.on('workspace:changed', debounce(() => {
    this.persistWorkspace(function(err) {
      debug('workspace persisted?', err);
    });
  }, 100));


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
        events={ this.events } />
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
    logger: this.logger
  });

  return new Component(actualOptions);
};

/**
 * Open a new tab based on a file chosen by the user.
 */
App.prototype.openDiagram = function() {

  var dialog = this.dialog;

  dialog.open((err, file) => {
    if (err) {
      dialog.openError(err, function() {
        debug('open-diagram canceled: %s', err);
      });

    } else if (!file) {
      debug('open-diagram canceled: no file');

    } else {
      var type = parseFileType(file);

      if (!type) {
        dialog.unrecognizedFileError(file, function() {
          debug('open-diagram canceled: unrecognized file type', file);
        });

      } else {
        this.createDiagramTabs([ assign(file, { fileType: type }) ]);
      }
    }
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
 * Create diagram tabs for the given files and
 * select the last tab.
 *
 * @param {Array<File>} files
 */
App.prototype.createDiagramTabs = function(files) {

  var lastFile = files[files.length - 1];

  files.forEach(file => {

    this.createDiagramTab(file, {
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
App.prototype.createDiagramTab = function(file, options) {
  this.events.emit('create-tab', file, options);
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

  done = done || function(err) {
    if (err) {
      dialog.saveError(err, function() {
        debug('error: %s', err);
      });
    }
  };

  var updateTab = (err, savedFile) => {

    if (err) {
      debug('save error! %s', err);
      return done(err);
    }

    debug('saved %s', tab.id);

    // finally saved...
    tab.setFile(savedFile);

    this.events.emit('workspace:persist');

    return done(null, savedFile);
  };

  var newFile,
      saveAs;

  debug('saving %s', tab.id);

  tab.save((err, file) => {

    if (err) {
      return done(err);
    }

    debug('exported %s \n%s', tab.id, file.contents);

    saveAs = isUnsaved(file) || options && options.saveAs;

    if (saveAs) {
      dialog.saveAs(file, (err, suggestedFile) => {

        debug('save %s as %s', tab.id, suggestedFile.path);

        if (err) {
          return done(err);
        }

        newFile = assign({}, file, suggestedFile);

        this.saveFile(newFile, updateTab);
      });
    } else {
      newFile = assign({}, file);

      this.saveFile(newFile, updateTab);
    }
  });
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
  this.createDiagramTabs(actualFiles);
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
      this.createDiagramTabs(config.tabs);
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
 * Start application.
 */
App.prototype.run = function() {
  this.events.emit('app:run');

  this.restoreWorkspace(function(err) {
    if (err) {
      debug('workspace restore error', err);
    } else {
      debug('workspace restored');
    }
  });
};


function contains(collection, element) {
  return collection.some(function(e) {
    return e === element;
  });
}
