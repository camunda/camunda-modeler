'use strict';

var debug = require('debug')('diagram-tab');

var inherits = require('inherits');

var h = require('vdom/h');

var isUnsaved = require('util/file/is-unsaved'),
    ensureOpts = require('util/ensure-opts');

var Tab = require('base/components/tab');

var assign = require('lodash/object/assign'),
    find = require('lodash/collection/find');


/**
 * A tab displaying a diagram.
 *
 * @param {Object} options
 */
function DiagramTab(options, viewOptions) {

  ensureOpts([
    'events',
    'file',
    'dialog'
  ], options);

  Tab.call(this, options);

  this.views = this.createViews(options);

  this.activeView = this.views[0];

  // initialize with passed file, if any
  if (options.file) {
    this.setFile(options.file);
  }
}

inherits(DiagramTab, Tab);

module.exports = DiagramTab;


DiagramTab.prototype.showView = function(id) {

  var newView = this.getView(id),
      oldView = this.activeView;

  // no need to switch views, if same
  if (newView === oldView) {
    return;
  }

  debug('[#showView] %s', newView.id);

  // export old view contents
  oldView.saveXML((err, xml) => {

    if (err) {
      debug('[#showView] view export error %s', err);
      return;
    }

    newView.once('shown', (results) => {
      debug('[#showView] view shown', err);

      var error = results && results.error;

      if (error) {

        // show error dialog
        this.dialog.openError(results.error, () => {

          // set the old view
          this.setView(oldView);
        });
      }
    });

    // sync XML contents
    newView.setXML(xml);

    // set new view
    this.setView(newView);
  });

};

DiagramTab.prototype.getView = function(id) {
  var view;

  if (typeof id === 'string') {
    view = find(this.views, { id: this.id + '#' + id });
  } else {
    view = id;
  }

  if (!view) {
    throw new Error('no view ' + id);
  }

  return view;
};

DiagramTab.prototype.setView = function(view) {
  this.activeView = view;
  this.events.emit('changed');
};

/**
 * Create and wire the views this tab consists of.
 *
 * @param {Object} options
 *
 * @return {Array<Object>} views
 */
DiagramTab.prototype.createViews = function(options) {
  debug('create views', options.viewDefinitions);

  return options.viewDefinitions.map(definition => {
    var id = definition.id,
        opts = assign({}, options, {
          id: options.id + '#' + id,
          shortId: id,
          label: definition.label
        });

    var ViewComponent = definition.component;

    var component = new ViewComponent(opts);

    component.on('layout:changed', this.events.composeEmitter('layout:update'));

    component.on('state-updated', this.events.composeEmitter('tools:state-changed', this));

    return component;
  });
};

/**
 * Save the tab, calling back with (err, file).
 *
 * @param {Function} done
 *
 * @return {Object}
 */
DiagramTab.prototype.save = function(done) {
  if (this.activeView.saveXML) {

    this.activeView.saveXML((err, xml) => {

      if (err) {
        return done(err);
      }

      return done(null, assign(this.file, { contents: xml }));
    });
  }
};

DiagramTab.prototype.setFile = function(file) {
  this.file = file;
  this.label = file.name,
  this.title = file.path,

  this.activeView.setXML(file.contents);

  this.events.emit('changed');
};

DiagramTab.prototype.isUnsaved = function() {
  return isUnsaved(this.file);
};

DiagramTab.prototype.triggerAction = function(action, options) {
  if (this.activeView.triggerAction) {
    this.activeView.triggerAction(action, options);
  }
};

DiagramTab.prototype.render = function() {

  var compose = this.compose;

  return (
    <div className="diagram-tab tabbed">
      <div className="content">
        { h(this.activeView) }
      </div>

      <div className="tabs">
        {
          this.views.map(view => {
            return (
              <div className={ 'tab ' + (this.activeView === view ? 'active' : '') }
                   tabIndex="0"
                   ref={ view.shortId + '-switch' }
                   onClick={ compose('showView', view) }>
                { view.label }
              </div>
            );
          })
        }
      </div>
    </div>
  );
};