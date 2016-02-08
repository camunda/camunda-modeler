'use strict';

var forEach = require('lodash/collection/forEach');

var DiagramTab = require('../app/tabs/diagram-tab');

/**
 * Workspace API used by app
 */
function Workspace() {
  
  this._session = {
    tabs: [],
    activeTabIndex: 0
  };

  /**
   * Persists open tabs (saved) and layout.
   *
   * The workspace will be persisted when:
   * - new tab is selected
   * - tabs are saved
   * - tabs are closed
   * - [todo] before editor quits
   *
   * @example
   * 	config = {
   * 		tabs: [
   * 			{
   *      	name: 'pizza_collaboration.bpmn',
   *      	contents: '<? xml ..>',
   *      	path: 'bpmn/pizza_collaboration.bpmn'
   * 		    layout: {
   * 			   	log: {
   * 				   	height: 150,
   * 				    open: false
   * 			     },
   * 			    propertiesPanel: {
   * 				   	width: 500,
   * 				    open: true
   * 			    }
   * 		    }
   * 			},
   * 			{
   *      	name: 'flight_plan.dmn',
   *      	contents: '<? xml ..>',
   *      	path: 'dmn/flight_plan.dmn',
   *      	layout: {
   * 			   	log: {
   * 				   	height: 150,
   * 				    open: false
   * 			     },
   * 			    propertiesPanel: {
   * 				   	width: 250,
   * 				    open: false
   * 			    }
   * 		    }
   * 			}
   * 		],
   * 	};
   *
   *
   * @param {Config} config
   * @param {Function} done
   */
  this.persist = (config, done) => {
    var session = {
      tabs: [],
      activeTabIndex: 0
    };

    // store tabs
    forEach(config.tabs, (tab, idx) => {
      var file = tab.file;

      if (!(tab instanceof DiagramTab) || file.path === '[unsaved]') {
        return;
      }

      session.tabs.push({
        name: file.name,
        contents: file.contents,
        path: file.path,
        layout: tab.layout,
        type: file.fileType
      });

      // find active tab, store index
      if (config.activeTab.id === tab.id) {
        session.activeTabIndex = session.tabs.length - 1;
      }
    });

    this._session = session;

    done(null, session);
  };

  /**
   * Open save error dialog and callback with (err).
   *
   * @param {File} file
   * @param {Function} done
   */
  this.restore = function(done) {
    done(null, this._session);
  };

}

module.exports = Workspace;
