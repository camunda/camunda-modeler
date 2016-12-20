'use strict';

var h = global.h = require('vdom/h');

var isString = require('lodash/lang/isString'),
    assign = require('lodash/object/assign');

var treeSelect = require('vtree-select');


function selectAll(selector, element) {
  expect(element).to.exist;

  return treeSelect(selector)(element);
}

module.exports.selectAll = selectAll;


function select(selector, element) {
  return (selectAll(selector, element) || [])[0];
}

module.exports.select = select;


function render(element) {

  // guard
  expect(element).to.exist;

  return h(element);
}

module.exports.render = render;


function simulateEvent(element, event, data) {

  // guard
  expect(element).to.exist;
  expect(event).to.exist;

  var eventName;

  if (isString(event)) {
    eventName = event;
    event = assign({ type: eventName }, data || {});
  } else {
    eventName = event.type;
  }

  var fn, listener, evHook;

  if (/^drag/.test(eventName)) {

    listener = element.properties['on' + eventName];

    if (!listener) {

      // see if we used the util/dragger facilities
      listener = element.properties['ondragstart'];

      // guard
      expect(listener).to.exist;

      if (eventName !== 'dragstart') {
        listener = listener['onDrag' + eventName.replace(/drag/, '')];
      }
    }

    fn = listener;
  } else {
    evHook = element.properties['ev-' + eventName];

    // guard
    expect(evHook).to.exist;

    fn = evHook.value;
  }

  // guard
  expect(fn).to.exist;

  return fn(event);
}

module.exports.simulateEvent = simulateEvent;