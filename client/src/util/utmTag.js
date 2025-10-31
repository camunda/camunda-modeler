/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * Returns the URL tagged with application specific UTM tags.
 *
 * Per default this will override existing UTM tags, to ensure consistent tagging.
 *
 * @param { string } urlString - The original URL
 * @param { { campaign?: string } } tags
 * @param { boolean } [override=true]
 *
 * @returns {string} The URL with UTM parameters.
 */
export function utmTag(urlString, tags, override = true) {
  const { campaign } = tags;

  const url = new URL(urlString);

  if (override) {
    url.searchParams.delete('utm_source');
    url.searchParams.delete('utm_medium');
    url.searchParams.delete('utm_campaign');
  }

  if (!url.searchParams.has('utm_source')) {
    url.searchParams.set('utm_source', 'modeler');
  }

  if (!url.searchParams.has('utm_medium')) {
    url.searchParams.set('utm_medium', 'product');
  }

  if (campaign && !url.searchParams.has('utm_campaign')) {
    url.searchParams.set('utm_campaign', campaign);
  }

  return url.toString();
}
