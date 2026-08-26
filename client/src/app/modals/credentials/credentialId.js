/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { generateId } from '../../../util';

const FALLBACK = 'CREDENTIAL';

const RESERVED_NAMES = new Set([
  'null',
  'true',
  'false',
  'function',
  'if',
  'then',
  'else',
  'for',
  'between',
  'instance',
  'of',
  'not'
]);

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const MAX_NAME_LENGTH = 256;

/**
 * Derive the cluster-variable name a credential is stored under. It becomes the
 * FEEL handle (`=camunda.vars.env.<id>`) and is fixed once created, so it must
 * use lowercase snake case and satisfy the `^[a-z_][a-z0-9_]*$` shape.
 *
 * @param {string} displayName
 * @returns {string}
 */
export function toCredentialId(displayName) {
  const slug = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!slug) {
    return '';
  }

  return /^[a-z_]/.test(slug) ? slug : `${ FALLBACK.toLowerCase() }_${ slug }`;
}

export function generateCredentialIdSuffix() {
  return generateId().slice(-6);
}

export function getUniqueCredentialIdentity(displayName, existingCredentials = [], suffix) {
  const normalizedDisplayName = displayName.trim();
  const displayNames = new Set(
    existingCredentials.map(credential => credential.metadata?.displayName?.trim())
  );

  for (let index = 0; index <= existingCredentials.length; index++) {
    const uniqueDisplayName = index
      ? `${ normalizedDisplayName } ${ index + 1 }`
      : normalizedDisplayName;

    if (!displayNames.has(uniqueDisplayName)) {
      return {
        displayName: uniqueDisplayName,
        credentialId: toRandomCredentialId(uniqueDisplayName, suffix)
      };
    }
  }

  console.error('Unable to generate a unique credential identity.');
}

export function toRandomCredentialId(displayName, suffix) {
  const credentialId = toCredentialId(displayName);

  return credentialId ? `${ credentialId }_${ suffix }` : '';
}

/**
 * Validate a credential ID against cluster-variable naming rules.
 *
 * @param {string} credentialId
 * @returns {string|null}
 */
export function getCredentialIdError(credentialId) {
  if (!credentialId) {
    return 'Credential ID is required.';
  }

  if (credentialId.length > MAX_NAME_LENGTH) {
    return `Credential ID must be at most ${ MAX_NAME_LENGTH } characters.`;
  }

  if (!NAME_PATTERN.test(credentialId)) {
    return 'Credential ID must contain only letters, numbers, and underscores, and must not start with a number.';
  }

  if (RESERVED_NAMES.has(credentialId)) {
    return 'Credential ID must not be a reserved literal or keyword.';
  }

  return null;
}
