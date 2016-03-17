'use strict';

var forEach = require('lodash/collection/forEach');

var ACTIVITI_NS = 'http://activiti.org/bpmn',
    CAMUNDA_NS = 'http://camunda.org/schema/1.0/bpmn';


function hasExtension(filePath) {
  return filePath && /\.(\w)+$/.test(filePath);
}

module.exports.hasExtension = hasExtension;


function hasActivitiURL(xml) {
  return xml.indexOf(ACTIVITI_NS) !== -1;
}

module.exports.hasActivitiURL = hasActivitiURL;


function replaceActivitiURL(xml) {
  var pattern = new RegExp(ACTIVITI_NS);

  return xml.replace(pattern, CAMUNDA_NS);
}

module.exports.replaceActivitiURL = replaceActivitiURL;


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


function replace(data) {
  var xml = data;

  var prefix = grabNamespacePrefix(xml);

  xml = replaceActivitiURL(xml);

  return replacePrefix(prefix, xml);
}

module.exports.replace = replace;
