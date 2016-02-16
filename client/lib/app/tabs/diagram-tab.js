'use strict';

var debug = require('debug')('diagram-tab');

var inherits = require('inherits');

var h = require('vdom/h');

var ensureOpts = require('util/ensure-opts');

var Tab = require('base/components/tab');

var assign = require('lodash/object/assign'),
    forEach = require('lodash/collection/forEach');


/**
 * A tab displaying a diagram.
 *
 * @param {Object} options
 */
function DiagramTab(options, viewOptions) {

  ensureOpts([ 'events', 'file' ], options);

  Tab.call(this, options);

  this.views = this.createViews(options);

  this.activeView = this.views[0];

  this.showView = function(id) {

    var view;

    if (typeof id === 'string') {
      view = find(this.views, { id: this.id + '#' + id });
    } else {
      view = id;
    }

    if (!view) {
      throw new Error('no view ' + id);
    }

    this.activeView = view;

    debug('show view %s', view.id);

    this.events.emit('changed');
  };

  /**
   * Save the tab, calling back with (err, file).
   *
   * @param {Function} done
   *
   * @return {Object}
   */
  this.save = function(done) {
    if (this.activeView.save) {
      this.activeView.save(done);
    }
  };

  this.updateState = function(newState) {
    this.events.emit('tools:update-edit-state', this, newState);
  };

  this.triggerAction = function(action, options) {
    if (this.activeView.triggerAction) {
      this.activeView.triggerAction(action, options);
    }
  };

  this.setFile = function(file) {
    this.file = file;
    this.label = file.name,
    this.title = file.path,

    forEach(this.views, function(view) {
      view.setFile(file);
    });

    this.events.emit('changed');
  };

  this.render = function() {

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

  // set file
  this.setFile(options.file);
}

inherits(DiagramTab, Tab);

module.exports = DiagramTab;


DiagramTab.prototype.createViews = function(options) {

  debug('create views', options.viewDefinitions);

  return options.viewDefinitions.map(definition => {
    var id = definition.id,
        opts = assign({}, options, {
          id: options.id + '#' + id,
          label: definition.label,
          tab: this
        });

    var ViewComponent = definition.component;

    return new ViewComponent(opts);
  });
};
