'use strict';

var forEach = require('lodash/collection/forEach');

var ACTIVITI_NS = 'http://activiti.org/bpmn',
    CAMUNDA_NS = 'http://camunda.org/schema/1.0/bpmn';

var NOTATIONS = {
  bpmn: [ ACTIVITI_NS, CAMUNDA_NS ]
};

function has(arr, item) {
  return arr.indexOf(item) !== -1;
}

function hasExtension(filePath) {
  return filePath && /\.(\w)+$/.test(filePath);
}

module.exports.hasExtension = hasExtension;


function hasOldNamespace(xml) {
  var result = [ ACTIVITI_NS ].map(function(ns) {
    return has(xml, ns);
  });

  return has(result, true);
}

module.exports.hasOldNamespace = hasOldNamespace;


function replaceNamespaceURL(xml, oldNs, newNs) {
  var pattern = new RegExp(oldNs, 'g');

  return xml.replace(pattern, newNs);
}

module.exports.replaceNamespaceURL = replaceNamespaceURL;


function grabNamespacePrefix(xml) {
  var pattern = /xmlns\:([A-z0-9.-]+)\=\"http\:\/\/activiti\.org\/bpmn\"/,
      match = xml.match(pattern);

  if (!match) {
    return null;
  }

  return match[1];
}

module.exports.grabNamespacePrefix = grabNamespacePrefix;


function replacePrefix(prefix, xml) {
  var patterns = [
    new RegExp('(xmlns:)[A-z0-9.-]+(="http://camunda.org/schema/1.0/bpmn")'),
    new RegExp('(\\s)' + prefix + '(:[A-z0-9-.]+)', 'g'),
    new RegExp('(<|</)' + prefix + '(:[A-z0-9-.]+(>|\\s))', 'g')
  ];

  forEach(patterns, function(pattern) {
    xml = xml.replace(pattern, '$1camunda$2');
  });

  return xml;
}

module.exports.replacePrefix = replacePrefix;


function replace(data, type) {
  var xml = data,
      namespaces = NOTATIONS[type];

  var prefix = grabNamespacePrefix(xml);

  var oldNs = namespaces[0],
      newNs = namespaces[1];

  xml = replaceNamespaceURL(xml, oldNs, newNs);

  return replacePrefix(prefix, xml);
}

module.exports.replace = replace;
