'use strict';

var slice = require('util/slice');

var Events = require('base/events');


function MockEvents() {

  var events = new Events();

  this.registeredListeners = [];

  this.recordedEvents = [];

  this.on = function() {

    var args = slice(arguments);

    this.registeredListeners.push(args);

    events.on.apply(events, args);
  };

  this.emit = function() {

    var args = slice(arguments);

    this.recordedEvents.push(args);

    events.emit.apply(events, args);
  };

  this.clear = function() {
    this.recordedEvents.length = 0;
    this.registeredListeners.length = 0;
  };

  this.composeEmitter = function() {
    return events.composeEmitter.apply(events, slice(arguments));
  };
}

module.exports = MockEvents;