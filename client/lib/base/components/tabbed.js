'use strict';

var h = require('vdom/h');

var ensureOpts = require('util/ensure-opts');

var scrollTabs = require('util/dom/scroll-tabs');

var find = require('lodash/collection/find');

var CloseHandle = require('./misc/close-handle');

var SCROLL_TABS_OPTIONS = {
  selectors: {
    tabsContainer: '.tabs-container',
    tab: '.tab',
    active: '.active',
    ignore: '.empty'
  }
};


function Tabbed(options) {

  ensureOpts([ 'onClose', 'onSelect' ], options);

  this.render = function() {

    var onClose = options.onClose,
        onSelect = options.onSelect,
        tabs = options.tabs,
        activeTab = options.active;

    var onScroll = (node) => {
      var tab = find(options.tabs, { id: node.tabId });

      if (tab) {
        onSelect(tab);
      }
    };

    var html =
      <div className={ 'tabbed ' + (options.className || '') }>
        <div className="tabs"
             scroll={ scrollTabs(SCROLL_TABS_OPTIONS, onScroll) }>
          <div className="scroll-tabs-button scroll-tabs-left">‹</div>
          <div className="scroll-tabs-button scroll-tabs-right">›</div>
          <div className="tabs-container">
            {
              tabs.map(tab => {

                if (!tab.id) {
                  throw new Error('no id specified');
                }

                var action = tab.action || onSelect.bind(null, tab);

                var className = [ tab === activeTab ? 'active' : '', 'tab', tab.empty ? 'empty' : '' ].join(' ');

                return (
                  <div className={ className }
                       key={ tab.id }
                       tabId={ tab.id }
                       title={ tab.title }
                       onClick={ action }
                       ref={ tab.id }
                       tabIndex="0">
                    { tab.label }
                    { tab.closable
                        ? <CloseHandle dirty={ tab.dirty }
                                       onClick={ onClose.bind(null, tab) } />
                        : null }
                  </div>
                );
              })
            }
          </div>
        </div>
        <div className="content">
          { activeTab ? h(activeTab) : null }
        </div>
      </div>;

    return html;
  };
}

module.exports = Tabbed;