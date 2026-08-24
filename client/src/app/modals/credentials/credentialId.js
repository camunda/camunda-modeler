/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

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
 * satisfy the `^[a-z_][a-z0-9_]*$` shape.
 *
 * @param {string} displayName
 * @returns {string}
 */
export function toCredentialId(displayName) {
  const slug = displayName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (!slug) {
    return '';
  }

  return /^[A-Z_]/.test(slug) ? slug : `${ FALLBACK }_${ slug }`;
}

export function getUniqueCredentialIdentity(displayName, existingCredentials = []) {
  const normalizedDisplayName = displayName.trim();
  const displayNames = new Set(
    existingCredentials.map(credential => credential.metadata?.displayName?.trim())
  );
  const credentialIds = new Set(
    existingCredentials.map(credential => credential.name)
  );

  for (let suffix = 0; suffix <= existingCredentials.length * 2; suffix++) {
    const uniqueDisplayName = suffix
      ? `${ normalizedDisplayName } ${ suffix }`
      : normalizedDisplayName;
    const credentialId = toCredentialId(uniqueDisplayName);

    if (!displayNames.has(uniqueDisplayName) && !credentialIds.has(credentialId)) {
      return {
        displayName: uniqueDisplayName,
        credentialId
      };
    }
  }

  console.error('Unable to generate a unique credential identity.');

  return {
    displayName: normalizedDisplayName,
    credentialId: toCredentialId(normalizedDisplayName)
  };
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
