'use strict';

var inherits = require('inherits');

var h = require('vdom/h');

var BaseComponent = require('base/component');

var ensureOpts = require('util/ensure-opts'),
    scrollTabs = require('util/dom/scroll-tabs'),
    dragTabs = require('util/dom/drag-tabs');

import {
  find,
  matchPattern
} from 'min-dash';

var noop = function() {};

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

  ensureOpts([
    'onClose',
    'onSelect',
    'onContextMenu'
  ], options);

  BaseComponent.call(this, options);

  this.render = function() {

    var onClose = options.onClose || noop,
        onSelect = options.onSelect || noop,
        onDragTab = options.onDragTab,
        onContextMenu = options.onContextMenu || noop,
        tabs = options.tabs,
        activeTab = options.active;

    var onScroll = (node) => {
      var tab = find(options.tabs, matchPattern({ id: node.tabId }));

      if (tab) {
        onSelect(tab);
      }
    };

    var onPositionChanged = (context) => {
      var dragTab = context.dragTab,
          newIdx = context.newIndex;

      var tab = find(tabs, matchPattern({ id: dragTab.tabId }));

      onDragTab(tab, newIdx);
    };

    var html =
      <div className={ 'tabbed ' + (options.className || '') }>
        <div
          className="tabs"
          scroll={ scrollTabs(TABS_OPTS, onScroll) }
          drag={ dragTabs(TABS_OPTS, onPositionChanged) }>
          <div className="scroll-tabs-button scroll-tabs-left">‹</div>
          <div className="scroll-tabs-button scroll-tabs-right">›</div>
          <div className="tabs-container">
            {
              tabs.map(tab => {

                if (!tab.id) {
                  throw new Error('no id specified');
                }

                function handleContextMenu(event) {
                  return onContextMenu(tab);
                }

                function handleSelect(event) {
                  if (event.button !== 0) {
                    return;
                  }

                  var triggerAction = tab.action || onSelect;

                  return triggerAction(tab);
                }

                function handleClose(event) {
                  event.stopPropagation();

                  return onClose(tab);
                }

                var className = [
                  tab === activeTab ? 'active' : '',
                  'tab',
                  tab.empty ? 'empty' : ''
                ].join(' ');

                return (
                  <div className={ className }
                    key={ tab.id }
                    ref={ tab.id }
                    tabId={ tab.id }
                    title={ tab.title }
                    onClick={ handleSelect }
                    onContextmenu={ handleContextMenu }
                    tabIndex="0">
                    { tab.label }
                    { tab.closable
                      ? <CloseHandle dirty={ tab.dirty }
                        onClick={ handleClose } />
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
