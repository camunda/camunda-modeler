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
    'file'
  ], options);

  Tab.call(this, options);

  this.views = this.createViews(options);

  this.activeView = this.views[0];

  this.showView = function(id, options) {

    var file = this.file,
        view = this.getView(id),
        oldView = this.activeView;

    options = options || {};

    // export xml
    this.activeView.saveXML((err, xml) => {
      if (err) {
        return;
      }

      if (file.contents !== xml) {
        file.contents = xml;
      }

      this.activeView = view;

      debug('show view %s', view.id);

      this.events.emit('changed');

      // import xml
      view.setXML(xml);

      view.once('imported', function(err, data) {
        if (err) {
          this.activeView = oldView;

          debug('show view %s', oldView.id);

          this.events.emit('changed');
          return;
        }

        this.events.emit('changed');
      });

    });
  };

  /**
   * Save the tab, calling back with (err, file).
   *
   * @param {Function} done
   *
   * @return {Object}
   */
  this.save = function(done) {
    if (this.activeView.saveXML) {

      this.activeView.saveXML((err, xml) => {

        if (err) {
          return done(err);
        }

        return done(null, assign(this.file, { contents: xml }));
      });
    }
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

    this.activeView.setXML(file.contents);

    this.events.emit('changed');
  };

  this.getView = function(id) {
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

  this.isUnsaved = function() {
    return isUnsaved(this.file);
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
          label: definition.label
        });

    var ViewComponent = definition.component;

    var component = new ViewComponent(opts);

    component.on('layout:changed', this.events.composeEmitter('layout:update'));

    component.on('state-updated', this.events.composeEmitter('tools:state-changed', this));

    return component;
  });
};
