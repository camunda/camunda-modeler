/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { findUsages as findNamespaceUsages } from '../../util/namespace';

/**
 * Namespaces of DMN versions that have to be migrated to DMN 1.3 to be opened.
 *
 * DMN 1.7 introduced permanent namespaces that no longer change with each DMN version.
 */
const DMN_NAMESPACES = {
  '1.1': 'http://www.omg.org/spec/DMN/20151101/dmn.xsd',
  '1.2': 'http://www.omg.org/spec/DMN/20180521/MODEL/',
  '1.4': 'https://www.omg.org/spec/DMN/20211108/MODEL/',
  '1.5': 'https://www.omg.org/spec/DMN/20230324/MODEL/',
  '1.6': 'https://www.omg.org/spec/DMN/20240513/MODEL/',
  '1.7': 'https://www.omg.org/spec/DMN/'
};

/**
 * Find the DMN version of a diagram that has to be migrated to DMN 1.3.
 *
 * @param {string} xml
 *
 * @returns {string|null} DMN version or null if no migration is required
 */
export function findDmnVersionToMigrate(xml) {
  const entry = Object.entries(DMN_NAMESPACES).find(
    ([ _, namespace ]) => findNamespaceUsages(xml, namespace)
  );

  return entry ? entry[ 0 ] : null;
}

/**
 * Get the dialog that asks whether to migrate a diagram to DMN 1.3.
 *
 * @param {string} dmnVersion
 *
 * @returns {Object}
 */
export function getMigrationDialog(dmnVersion) {
  if (isNewerThanDmn13(dmnVersion)) {
    return {
      type: 'warning',
      title: `DMN ${ dmnVersion } Diagram Detected`,
      buttons: [
        { id: 'cancel', label: 'Cancel' },
        { id: 'yes', label: 'Yes' }
      ],
      defaultId: 1,
      message: 'Would you like to convert your diagram to DMN 1.3?',
      detail: [
        'Camunda Modeler can only edit DMN 1.3 diagrams.',
        'Elements not supported by DMN 1.3 will be removed when saving.'
      ].join('\n')
    };
  }

  return {
    type: 'warning',
    title: `Deprecated DMN ${ dmnVersion } Diagram Detected`,
    buttons: [
      { id: 'cancel', label: 'Cancel' },
      { id: 'yes', label: 'Yes' }
    ],
    defaultId: 1,
    message: 'Would you like to migrate your diagram to DMN 1.3?',
    detail: [
      'Only DMN 1.3 diagrams can be opened with Camunda Modeler v4.0.0 or later.',
    ].join('\n'),
    checkboxChecked: true,
    checkboxLabel: 'Do not ask again.'
  };
}

/**
 * Check whether migrating from a DMN version may remove elements, as the version is
 * newer than DMN 1.3. Such a migration must always be confirmed.
 *
 * @param {string} dmnVersion
 *
 * @returns {boolean}
 */
export function isNewerThanDmn13(dmnVersion) {
  return Number(dmnVersion.split('.')[ 1 ]) > 3;
}
