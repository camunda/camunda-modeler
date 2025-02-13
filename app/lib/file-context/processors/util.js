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

const { getFileExtension } = require('../util');

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

function findProcessApplicationFile(filePath) {
  let dirName = path.dirname(filePath);

  while (dirName !== path.parse(dirName).root) {
    const fileNames = fs.readdirSync(dirName);

    const fileName = fileNames.find(fileName => {
      return getFileExtension(fileName) === '.process-application';
    });

    if (fileName) {
      return path.join(dirName, fileName);
    }

    dirName = path.dirname(dirName);
  }

  return false;
}

module.exports.findProcessApplicationFile = findProcessApplicationFile;

function isProcessApplicationFile(filePath) {
  return getFileExtension(filePath) === '.process-application';
}

module.exports.isProcessApplicationFile = isProcessApplicationFile;