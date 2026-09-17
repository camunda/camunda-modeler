/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');

const log = require('../../log')('app:file-context:processors:util');

const { Parser } = require('saxen');

function findExtensionElement(element, type) {
  const extensionElements = element.get('extensionElements');

  if (!extensionElements) {
    return;
  }

  return extensionElements.get('values').find(value => is(value, type));
}

module.exports.findExtensionElement = findExtensionElement;

function is(node, type) {
  return (
    (typeof node.$instanceOf === 'function')
      ? node.$instanceOf(type)
      : node.$type === type
  );
}

module.exports.is = is;

function traverse(element, options) {
  const enter = options.enter || null;
  const leave = options.leave || null;

  const enterSubTree = enter && enter(element);

  const descriptor = element.$descriptor;

  if (enterSubTree !== false && !descriptor.isGeneric) {
    const containedProperties = descriptor.properties.filter(p => {
      return !p.isAttr && !p.isReference && p.type !== 'String';
    });

    containedProperties.forEach(p => {
      if (p.name in element) {
        const propertyValue = element[p.name];

        if (p.isMany) {
          propertyValue.forEach(child => {
            traverse(child, options);
          });
        } else {
          traverse(propertyValue, options);
        }
      }
    });
  }

  leave && leave(element);
}

module.exports.traverse = traverse;

const CAMUNDA_PROJECT_FILE = 'camunda-project.json';
const LEGACY_CAMUNDA_PROJECT_FILE = '.process-application';

function findCamundaProjectFile(filePath) {
  let dirName = path.dirname(filePath);

  while (dirName !== path.dirname(dirName)) {
    let fileNames;

    try {
      fileNames = fs.readdirSync(dirName);
    } catch (error) {
      log.error('Failed to read directory', error);
      return false;
    }

    const fileName = fileNames.includes(CAMUNDA_PROJECT_FILE)
      ? CAMUNDA_PROJECT_FILE
      : fileNames.find(fileName => fileName === LEGACY_CAMUNDA_PROJECT_FILE);

    if (fileName) {
      return path.join(dirName, fileName);
    }

    dirName = path.dirname(dirName);
  }

  return false;
}

module.exports.findCamundaProjectFile = findCamundaProjectFile;

function isCamundaProjectFile(filePath) {
  const fileName = path.basename(filePath);

  return fileName === CAMUNDA_PROJECT_FILE || fileName === LEGACY_CAMUNDA_PROJECT_FILE;
}

module.exports.isCamundaProjectFile = isCamundaProjectFile;

const XML_NS_MODELER = 'http://camunda.org/schema/modeler/1.0';
const XML_NS_ZEEBE = 'http://camunda.org/schema/zeebe/1.0';

const EXECUTION_PLATFORM_CAMUNDA_CLOUD = 'Camunda Cloud';

function isCamunda8XML(xml) {
  let result = false;

  const parser = new Parser();

  parser.on('error', function() {
    parser.stop();
  });

  parser.on('openTag', (_, getAttributes) => {
    parser.stop();

    const attributes = getAttributes();

    if (getAttribute(attributes, 'modeler', 'xmlns') === XML_NS_MODELER && getAttribute(attributes, 'executionPlatform', 'modeler') === EXECUTION_PLATFORM_CAMUNDA_CLOUD) {
      result = true;
    }

    if (getAttribute(attributes, 'zeebe', 'xmlns') === XML_NS_ZEEBE) {
      result = true;
    }
  });

  parser.parse(xml);

  return result;
}

module.exports.isCamunda8BPMN = isCamunda8XML;
module.exports.isCamunda8DMN = isCamunda8XML;

function isCamunda8Form(json) {
  let executionPlatform;

  try {
    ({ executionPlatform } = JSON.parse(json));
  } catch (error) {
    throw new Error(`Failed to parse form file: ${ error.message }`);
  }

  return executionPlatform === EXECUTION_PLATFORM_CAMUNDA_CLOUD;

}

module.exports.isCamunda8Form = isCamunda8Form;

/**
 * @param {Map<string, string>} attributes
 * @param {string} attribute
 * @param {string} prefix
 *
 * @returns {string | undefined}
 */
function getAttribute(attributes, attribute, prefix) {
  return attributes[ `${prefix}:${attribute}` ] || attributes[ attribute ];
}
