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
 * Synonym Index for connector element templates.
 *
 * Background — the Connectors team's "Native Operations" prototype proposed
 * synonym-aware search across all 122+ connector templates so that typing
 * "send message" surfaces Slack, Kafka, Twilio, etc. — not just whichever
 * connector name the user remembered. This module is a small, pure-JS
 * implementation of that index that the existing guided-append search-corpus
 * builder can consume.
 *
 * Two synonym surfaces are supported in template JSON:
 *
 *   1. Top-level `keywords: string[]` — the canonical surface used in
 *      `~/Downloads/Native Ops PRD/element-templates/*.json` (120 of them
 *      ship with curated keywords).
 *
 *   2. Per-operation `synonyms: { [operationKey]: string[] }` — used by
 *      newer agentic-AI templates and proposed for all multi-op connectors
 *      in the Native Ops PRD to support per-operation matching
 *      (e.g., GitHub `issues create_issue` → ["create issue", "open issue"]).
 *
 * The index normalizes both surfaces to a flat list of `(templateId, term)`
 * pairs, queryable via `templateMatchesQuery`. Caller decides ranking.
 *
 * Normalization: lowercase, replace runs of non-alphanumeric characters with
 * a single space, trim. Matching is substring on normalized form so callers
 * don't have to care about underscores vs spaces vs casing.
 */

/**
 * @typedef {Object} ElementTemplate
 * @property {string} id
 * @property {string} [name]
 * @property {string} [description]
 * @property {string[]} [keywords]
 * @property {Object<string, string[]>} [synonyms]
 */

/**
 * @typedef {Object} SynonymEntry
 * @property {string} templateId
 * @property {string} term       Original term (preserved for display/debug).
 * @property {string} normalized Normalized form used for matching.
 * @property {string} source     "keyword" | "synonym" | "name" | "description".
 * @property {string} [operationKey] Set when source is "synonym".
 */

/**
 * Normalize a string for matching: lowercase, collapse non-alphanumeric runs
 * to single spaces, trim.
 *
 * @param {string} input
 * @returns {string}
 */
export function normalize(input) {
  if (input == null) return '';
  return String(input).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Build the synonym index from a list of element templates.
 *
 * @param {ElementTemplate[]} templates
 * @param {Object<string, string[]>} [overrides] - optional per-template-id
 *   synonym map (see synonymOverrides.js). Folded in alongside any `keywords`
 *   on the template. Use this to backfill synonym coverage for marketplace
 *   templates we can't edit directly.
 * @returns {{
 *   entries: SynonymEntry[],
 *   byTemplate: Map<string, SynonymEntry[]>,
 *   templateMatchesQuery: (templateId: string, query: string) => boolean,
 *   findMatches: (query: string) => SynonymEntry[]
 * }}
 */
export function buildSynonymIndex(templates, overrides) {
  const entries = [];
  const byTemplate = new Map();

  function addEntry(entry) {
    if (!entry.normalized) return;
    entries.push(entry);
    if (!byTemplate.has(entry.templateId)) {
      byTemplate.set(entry.templateId, []);
    }
    byTemplate.get(entry.templateId).push(entry);
  }

  (templates || []).forEach(template => {
    if (!template || typeof template.id !== 'string') return;
    const templateId = template.id;

    if (typeof template.name === 'string') {
      addEntry({
        templateId,
        term: template.name,
        normalized: normalize(template.name),
        source: 'name'
      });
    }

    if (typeof template.description === 'string') {
      addEntry({
        templateId,
        term: template.description,
        normalized: normalize(template.description),
        source: 'description'
      });
    }

    if (Array.isArray(template.keywords)) {
      template.keywords.forEach(keyword => {
        if (typeof keyword !== 'string') return;
        addEntry({
          templateId,
          term: keyword,
          normalized: normalize(keyword),
          source: 'keyword'
        });
      });
    }

    // Per-id overrides — backfill synonyms for marketplace templates we can't
    // edit directly. Same shape as `keywords` (flat string list).
    const idOverrides = overrides && overrides[templateId];
    if (Array.isArray(idOverrides)) {
      idOverrides.forEach(term => {
        if (typeof term !== 'string') return;
        addEntry({
          templateId,
          term,
          normalized: normalize(term),
          source: 'keyword'
        });
      });
    }

    if (template.synonyms && typeof template.synonyms === 'object') {
      Object.keys(template.synonyms).forEach(operationKey => {
        const list = template.synonyms[operationKey];
        if (!Array.isArray(list)) return;
        list.forEach(synonym => {
          if (typeof synonym !== 'string') return;
          addEntry({
            templateId,
            term: synonym,
            normalized: normalize(synonym),
            source: 'synonym',
            operationKey
          });
        });
      });
    }
  });

  function templateMatchesQuery(templateId, query) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return false;
    const list = byTemplate.get(templateId);
    if (!list) return false;
    return list.some(entry => entry.normalized.indexOf(normalizedQuery) !== -1);
  }

  function findMatches(query) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];
    return entries.filter(entry =>
      entry.normalized.indexOf(normalizedQuery) !== -1
    );
  }

  return {
    entries,
    byTemplate,
    templateMatchesQuery,
    findMatches
  };
}
