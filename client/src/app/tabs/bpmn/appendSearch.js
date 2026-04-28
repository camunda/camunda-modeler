/**
 * appendSearch — builds a ranked, section-grouped list of appendable items.
 *
 * Sections reflect Camunda's product vocabulary:
 *   1. elements   — plain BPMN leaves (tasks, gateways, events, call activity)
 *   2. ai-agents  — AI agent / AI action templates (id namespace `io.camunda.agenticai.*`)
 *   3. connectors — connector templates (id namespace `io.camunda.connectors.*`, excl. agenticai)
 *   4. rpa        — RPA bot templates (id namespace `io.camunda.rpa.*`)
 *
 * Not included in search (deliberate):
 *   - `from-catalog` stub leaves ("Approval pattern", etc.) — surface in browse-mode
 *     drill-down only, so search results never promise things that aren't wired up.
 *   - Sample / prototype templates (`io.camunda.examples.*`, `io.camunda.prototype.*`)
 *     — dev-only, noise in user-facing results.
 *
 * Section order is fixed (Elements first always), score ranks within a section.
 * This matches the keyboard-first flow: arrow-down walks Elements top-to-bottom,
 * then AI Agents, then Connectors, then RPA. No score-jitter across sections.
 *
 * When the Hub Private Catalog (epic #3402) ships, a fifth section ('catalog')
 * will be populated from template provenance metadata — not id namespace.
 */

import { APPEND_GROUPS } from './appendCatalog';
import { scoreCommand } from '../cloud-bpmn/command-palette/commandIndex';

const SECTION_ORDER = [ 'elements', 'ai-agents', 'connectors', 'rpa' ];

const SECTION_META = {
  elements:   { label: 'Elements' },
  'ai-agents': { label: 'AI Agents' },
  connectors: { label: 'Connectors' },
  rpa:        { label: 'RPA' }
};

// Minimum score to keep a result. Pure subsequence-only hits (no prefix, no
// word-boundary bonus) typically land under 20 and usually aren't what the
// user meant — filtering them cleans up the tail. Prefix/startsWith scores
// well above this (800+) so common queries stay robust.
const MIN_SCORE = 20;

// Cap per section. Keeps long tail from overwhelming the dropdown; overflow
// is signaled via `overflow` count on the section so the UI can render a
// muted "+N more — narrow your search" row.
const PER_SECTION_CAP = 6;

// Groups from appendCatalog that count as "elements" for search purposes.
// `from-catalog` is deliberately excluded (stubs).
const ELEMENT_GROUP_IDS = new Set([
  'tasks',
  'gateways',
  'intermediate-events',
  'call-activity',
  'connector',    // generic connector service-task leaf — still a plain element
  'ai-agents'     // these leaves (ai-agent-subprocess, ai-connector) are Elements too;
                  // real `io.camunda.agenticai.*` TEMPLATES go into the ai-agents SECTION.
]);

/**
 * Classify a template into a section based on its id namespace.
 * Returns one of the SECTION_ORDER strings or null to drop the template.
 */
export function classifyTemplate(template) {
  const id = (template && template.id || '').toLowerCase();
  if (!id) return null;
  if (id.startsWith('io.camunda.agenticai.')) return 'ai-agents';
  if (id.startsWith('io.camunda.rpa.'))       return 'rpa';
  if (id.startsWith('io.camunda.connectors.')) return 'connectors';
  // Dev / sample namespaces are not shown in search.
  if (id.startsWith('io.camunda.examples.')
      || id.startsWith('io.camunda.prototype.')) return null;
  // Unrecognized namespace: treat as Connector-family by default. These are
  // typically customer-custom or third-party templates that apply to tasks.
  return 'connectors';
}

/**
 * @param {object} opts
 * @param {string} opts.query               - search text (non-empty; caller should short-circuit on empty)
 * @param {Array}  opts.templates           - element templates from elementTemplates service
 * @param {string} opts.sourceElementType   - reserved for future per-source filtering
 * @param {object} [opts.synonymIndex]      - optional Synonym Index built from connectors-context/synonymIndex.js;
 *                                            when present, per-operation synonyms are folded into each template's
 *                                            search keywords so phrases like "send message" match Slack, Kafka,
 *                                            Twilio, etc. across the catalog (Native Ops PRD pattern).
 * @returns {{ sections: Array<{ id, label, items: Array, overflow: number }> }}
 */
export function buildAppendResults({ query, templates = [], synonymIndex /*, sourceElementType */ }) {
  const q = (query || '').trim();
  if (!q) return { sections: [] };

  // Score everything first into a flat scored pool keyed by section.
  const pool = {
    elements:   [],
    'ai-agents': [],
    connectors: [],
    rpa:        []
  };

  // 1. Leaves from appendCatalog.
  for (const group of APPEND_GROUPS) {
    if (!ELEMENT_GROUP_IDS.has(group.id)) continue;
    for (const leaf of group.leaves) {
      // Curated per-leaf keywords (added in appendCatalog.js). Hint is included
      // as a secondary signal but group label is NOT — it would spread matches
      // across every sibling leaf and dilute ranking.
      const cmd = {
        label: leaf.label,
        keywords: [ leaf.keywords, leaf.hint ].filter(Boolean).join(' ')
      };
      const score = scoreCommand(cmd, q);
      if (score < MIN_SCORE) continue;
      pool.elements.push({
        id: `leaf:${leaf.elementId}`,
        label: leaf.label,
        hint: leaf.hint,
        icon: leaf.icon,
        section: 'elements',
        source: 'leaf',
        leaf,
        score
      });
    }
  }

  // 2. Element templates — classify by id namespace, score against friendly name.
  for (const t of templates) {
    if (!isTemplateAppendable(t)) continue;
    const section = classifyTemplate(t);
    if (!section || section === 'elements') continue;

    // Friendly name only; NEVER include the raw id namespace — too much noise.
    // Pull synonym terms from three surfaces (in priority order):
    //   1. top-level `keywords: string[]` — the surface used by Hub-prototype
    //      connector templates (Native Ops PRD, ~120 of 122 templates).
    //   2. `metadata.keywords: string` — the legacy curated-keyword field.
    //   3. `description` — last-resort fallback.
    // Per-operation `synonyms` are folded in at template-load time via the
    // optional `synonymIndex` arg — see `getSynonymTerms()` below.
    const friendlyName = t.name || shortenTemplateId(t.id);
    const topLevelKeywords = Array.isArray(t.keywords) ? t.keywords.join(' ') : null;
    const synonymTerms = synonymIndex ? getSynonymTerms(synonymIndex, t.id) : null;
    const kw = [
      topLevelKeywords,
      t.metadata && t.metadata.keywords,
      synonymTerms,
      t.description
    ].filter(Boolean).join(' ');

    const cmd = { label: friendlyName, keywords: kw };
    const score = scoreCommand(cmd, q);
    if (score < MIN_SCORE) continue;

    pool[section].push({
      id: `template:${t.id}`,
      label: friendlyName,
      hint: t.description || '',
      icon: iconForTemplate(t, section),
      iconSrc: getTemplateIconSrc(t),
      section,
      source: 'template',
      template: t,
      score
    });
  }

  // 3. Sort each section by score desc, apply cap, build sections array in SECTION_ORDER.
  const sections = [];
  for (const sid of SECTION_ORDER) {
    const items = pool[sid];
    if (!items || items.length === 0) continue;
    items.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
    const overflow = Math.max(0, items.length - PER_SECTION_CAP);
    sections.push({
      id: sid,
      label: SECTION_META[sid].label,
      items: items.slice(0, PER_SECTION_CAP),
      overflow
    });
  }

  return { sections };
}

/**
 * Pull all indexed synonym terms for a template id and join them into one
 * keyword blob the existing scorer can consume. Returns null if the index
 * has no entries for that template.
 */
function getSynonymTerms(synonymIndex, templateId) {
  if (!synonymIndex || !synonymIndex.byTemplate) return null;
  const entries = synonymIndex.byTemplate.get(templateId);
  if (!entries || entries.length === 0) return null;
  // Skip 'name' and 'description' sources — those are already represented
  // in friendlyName and t.description respectively. We only want the extra
  // synonym surface (keywords + per-operation synonyms).
  const extra = entries
    .filter(e => e.source === 'keyword' || e.source === 'synonym')
    .map(e => e.term);
  return extra.length ? extra.join(' ') : null;
}

function isTemplateAppendable(template) {
  const appliesTo = template && template.appliesTo || [];
  return appliesTo.some(a =>
    a === 'bpmn:Task' ||
    a === 'bpmn:ServiceTask' ||
    a === 'bpmn:UserTask' ||
    a === 'bpmn:BusinessRuleTask' ||
    a === 'bpmn:ScriptTask' ||
    a === 'bpmn:SendTask' ||
    a === 'bpmn:CallActivity' ||
    a === 'bpmn:SubProcess' ||
    a === 'bpmn:AdHocSubProcess'
  );
}

/**
 * Last-resort label when a template has no `name` field — take the final
 * dotted segment of the id and humanize it. Never show the full namespace.
 */
function shortenTemplateId(id) {
  if (!id) return 'Template';
  const tail = id.split('.').pop();
  // Strip trailing ".vN" version markers.
  return tail.replace(/^v\d+$/i, '') || tail || 'Template';
}

/**
 * Font-icon class per section. Used as the fallback when a template doesn't
 * carry its own image icon (see getTemplateIconSrc) — every template gets
 * one or the other, never both at render time.
 */
function iconForTemplate(template, section) {
  if (section === 'ai-agents') return 'bpmn-icon-subprocess-expanded';
  if (section === 'rpa') return 'bpmn-icon-business-rule-task';
  return 'bpmn-icon-service-task';
}

/**
 * Pull a renderable image src from a template's `icon` field. Element
 * templates may carry a brand SVG either as a data URL (the common case for
 * connector templates — see ~/Downloads/Native Ops PRD/element-templates/*)
 * or as a regular URL. We accept both.
 *
 * Returns null when the template has no usable icon — the caller falls back
 * to the section font-icon class from iconForTemplate.
 */
function getTemplateIconSrc(template) {
  const icon = template && template.icon;
  if (!icon) return null;
  if (typeof icon === 'string') return icon;
  if (typeof icon.contents === 'string') return icon.contents;
  if (typeof icon.url === 'string') return icon.url;
  return null;
}
