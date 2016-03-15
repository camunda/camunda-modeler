'use strict';

var BaseComponent = require('base/component');

var inherits = require('inherits');

var ensureOpts = require('util/ensure-opts');

var dragger = require('util/dom/dragger');

var copy = require('util/copy');

var isEscape = require('util/event/is-escape');

var format = require('util').format;
var padding = require('util/padding');


function Log(options) {

  BaseComponent.call(this);

  ensureOpts([ 'events', 'layout', 'log' ], options);

  var events = options.events;


  this.resizeLog = function onDrag(logLayout, event, delta) {

    var oldHeight = logLayout.open ? logLayout.height : 0;

    var newHeight = Math.max(oldHeight + delta.y * -1, 0);

    events.emit('layout:update', {
      log: {
        open: newHeight > 25,
        height: newHeight
      }
    });
  };

  this.closeOnEscape = function(event) {
    if (isEscape(event)) {
      this.toggleLog();
    }
  };

  this.toggleLog = function() {
    events.emit('layout:update', {
      log: {
        open: !options.layout.log.open
      }
    });
  };

  this.clearLog = function() {
    options.log.clear();
  };

  this.render = function() {

    var compose = this.compose;

    var entries = options.log.entries;

    var focusedEntry = entries[entries.length - 1];

    var logLayout = options.layout.log;

    var logStyle = {
      height: (logLayout.open ? logLayout.height : 0) + 'px'
    };

    return (
      <div className="log">
        <div className="header" >
          <div className="log-toggle" onClick={ compose('toggleLog') }>Toggle log</div>
          <span className="separator"></span>
          <div className="log-clear" onClick={ compose('clearLog') }>Clear log</div>
        </div>
        <div className="resize-handle"
             draggable="true"
             onDragStart={ dragger(compose('resizeLog', copy(logLayout))) }></div>
        {
          logLayout.open
            ? <div className="entries"
                   style={ logStyle }
                   tabIndex="0"
                   onKeydown={ compose('closeOnEscape') }>
                {
                  entries.map(function(e) {

                    var action = e.action;

                    var msg = format('%s  %s  %s', e.timestamp, padding.padRight(e.category.toUpperCase(), 5), e.message);

                    var html =
                      <div className="entry" scrollTo={ e === focusedEntry }>
                        {
                          action
                            ? <a href="#" onClick={ action }>{ msg }</a>
                            : <span>{ msg }</span>
                        }
                      </div>;

                    return html;
                  })
                }
              </div>
            : null
        }
      </div>
    );
  };
}

inherits(Log, BaseComponent);

module.exports = Log;