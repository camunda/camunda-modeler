/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import {
  Parser
} from 'saxen';


/**
 * Find usage of uri as a namespace in the given XML document.
 *
 * @param {string} xml
 * @param {string} uri
 *
 * @return {false|{ uri, prefixes, targetNamespace }} uri}
 */
export function findUsages(xml, uri) {

  let prefixes = [];
  let targetNamespace = false;

  const parser = new Parser();

  parser.on('error', function() {
    parser.stop();
  });

  parser.on('openTag', (_, getAttributes) => {

    parser.stop();

    Object.entries(getAttributes()).map(entry => {
      const [ key, value ] = entry;

      if (value !== uri) {
        return;
      }

      if (key === 'targetNamespace') {
        targetNamespace = true;

        return;
      }

      // xmlns="..."
      // xmlns:${prefix}=""
      const match = /^xmlns(?::(.*))?$/.exec(key);

      if (match) {
        prefixes.push(match[1] || '');
      }
    });

  });

  parser.parse(xml);

  if (prefixes.length === 0 && !targetNamespace) {
    return false;
  }

  return {
    prefixes,
    uri
  };

}


/**
 * Replace namespace usages in the given XML file with
 * a new namespace ({ prefix, uri }).@async
 * @param  {[type]} xml    [description]
 * @param  {[type]} usages [description]
 * @param  {[type]} ns     [description]
 * @return {[type]}        [description]
 */
export function replaceUsages(xml, usages, ns) {

  // ensures that any result of #findUsages may be fet
  // into this utility
  if (usages === false) {
    return xml;
  }

  const {
    uri: oldNamespaceUrl,
    prefixes: oldPrefixes
  } = usages;

  const {
    prefix: newPrefix,
    uri: newNamespaceUrl
  } = ns;

  const conversions = [
    [ new RegExp(`(\\sxmlns:)[A-z0-9.-]+="${ escape(oldNamespaceUrl) }"`, 'g'), `$1${newPrefix}="${newNamespaceUrl}"` ],
    [ new RegExp(`(\\s)targetNamespace="${ escape(oldNamespaceUrl) }"`, 'g'), `$1targetNamespace="${newNamespaceUrl}"` ]
  ];

  oldPrefixes.forEach(prefix => {
    const safePrefix = escape(prefix);

    conversions.push(
      [ new RegExp('(\\s)' + safePrefix + '(:[A-z0-9-.]+)', 'g'), `$1${newPrefix}$2` ],
      [ new RegExp('(<|</)' + safePrefix + '(:[A-z0-9-.]+(>|\\s))', 'g'), `$1${newPrefix}$2` ]
    );
  });

  return conversions.reduce((xml, conversion) => {

    const [ pattern, replacement ] = conversion;

    return xml.replace(pattern, replacement);
  }, xml);
}


// helpers /////////////////

function escape(pattern) {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}