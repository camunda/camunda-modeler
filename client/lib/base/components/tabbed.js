'use strict';

var inherits = require('inherits');

var h = require('vdom/h');

var BaseComponent = require('base/component');

var ensureOpts = require('util/ensure-opts'),
    scrollTabs = require('util/dom/scroll-tabs'),
    dragTabs = require('util/dom/drag-tabs');

var find = require('lodash/collection/find');

var CloseHandle = require('base/components/misc/close-handle');


var TABS_OPTS = {
  selectors: {
    tabsContainer: '.tabs-container',
    tab: '.tab',
    active: '.active',
    ignore: '.empty'
  }
};


function Tabbed(options) {

  ensureOpts([ 'onClose', 'onSelect', 'onContextMenu' ], options);

  BaseComponent.call(this, options);

  this.render = function() {

    var onClose = options.onClose,
        onSelect = options.onSelect,
        onDragTab = options.onDragTab,
        onContextMenu = options.onContextMenu,
        tabs = options.tabs,
        activeTab = options.active;

    var onScroll = (node) => {
      var tab = find(options.tabs, { id: node.tabId });

      if (tab) {
        onSelect(tab);
      }
    };

    var onPositionChanged = (context) => {
      var dragTab = context.dragTab,
          newIdx = context.newIndex;

      var tab = find(tabs, { id: dragTab.tabId });

      onDragTab(tab, newIdx);
    };

    var html =
      <div className={ 'tabbed ' + (options.className || '') }>
        <div className="tabs"
             scroll={ scrollTabs(TABS_OPTS, onScroll) }
             drag={ dragTabs(TABS_OPTS, onPositionChanged) } >
          <div className="scroll-tabs-button scroll-tabs-left">‹</div>
          <div className="scroll-tabs-button scroll-tabs-right">›</div>
          <div className="tabs-container" >
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
                       ref={ tab.id }
                       tabId={ tab.id }
                       title={ tab.title }
                       onMousedown={ action }
                       onContextmenu={ onContextMenu.bind(null, tab) }
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

inherits(Tabbed, BaseComponent);

module.exports = Tabbed;
