'use strict';

var h = require('vdom/h');

var ensureOpts = require('util/ensure-opts');

var CloseHandle = require('./misc/close-handle');


function Tabbed(options) {

  ensureOpts([ 'events' ], options);


  this.render = function() {

    var events = options.events;

    var tabs = options.tabs,
        activeTab = options.active;

    var html =
      <div className={ 'tabbed ' + (options.className || '') }>
        <div className="tabs">
          {
            tabs.map(tab => {

              if (!tab.id) {
                throw new Error('no id specified');
              }

              var action = tab.action || events.composeEmitter('tab:select', tab);

              return (
                <div className={ tab === activeTab ? 'active tab' : 'tab'}
                     key={ tab.id }
                     title={ tab.title }
                     onClick={ action }
                     ref={ tab.id }
                     tabIndex="0">
                  { tab.label }
                  { tab.closable
                      ? <CloseHandle dirty={ tab.dirty }
                                     onClick={ events.composeEmitter('tab:close', tab) } />
                      : null }
                </div>
              );
            })
          }
        </div>
        <div className="content">
          { activeTab ? h(activeTab) : null }
        </div>
      </div>;

    return html;
  };
}

module.exports = Tabbed;