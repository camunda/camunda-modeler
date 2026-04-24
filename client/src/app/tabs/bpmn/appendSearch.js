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
 * @returns {{ sections: Array<{ id, label, items: Array, overflow: number }> }}
 */
export function buildAppendResults({ query, templates = [] /*, sourceElementType */ }) {
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
    // Template JSON schema supports a `metadata.keywords` field; use it if present.
    const friendlyName = t.name || shortenTemplateId(t.id);
    const kw = [
      t.metadata && t.metadata.keywords,
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
 * Icon class per section. Future refinement: connector templates may carry
 * their own icon URL in `t.icon.contents` — swap in an <img> when present.
 */
function iconForTemplate(template, section) {
  if (section === 'ai-agents') return 'bpmn-icon-subprocess-expanded';
  if (section === 'rpa') return 'bpmn-icon-business-rule-task';
  return 'bpmn-icon-service-task';
}
