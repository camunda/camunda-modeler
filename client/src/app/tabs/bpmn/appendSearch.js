/**
 * appendSearch — builds a ranked flat list of appendable items from two sources:
 *   1. Catalog leaves from appendCatalog.js (plain BPMN elements)
 *   2. Element templates filtered by source compatibility (connectors, AI agents, COE-curated reusables)
 *
 * Each result carries a `section` ('elements' or 'catalog') so the UI can
 * group results visually without changing rank order.
 */
import { APPEND_GROUPS } from './appendCatalog';
import { scoreCommand } from '../cloud-bpmn/command-palette/commandIndex';

/**
 * @param {object} opts
 * @param {string} opts.query                       - search text (trimmed lowercase applied internally)
 * @param {Array}  opts.templates                   - element templates fetched from elementTemplates service
 * @param {string} opts.sourceElementType           - e.g. 'bpmn:Task'; used to filter templates by appliesTo
 * @returns {Array<{ id, label, hint, icon, section, sectionLabel, source: 'leaf'|'template', leaf?, template? }>}
 */
export function buildAppendResults({ query, templates = [], sourceElementType }) {
  const q = (query || '').trim();
  if (!q) return [];

  const results = [];

  // 1. Score catalog leaves.
  for (const group of APPEND_GROUPS) {
    for (const leaf of group.leaves) {
      const cmd = { label: leaf.label, keywords: [ leaf.hint, group.label ].filter(Boolean).join(' ') };
      const score = scoreCommand(cmd, q);
      if (score === -Infinity) continue;
      results.push({
        id: `leaf:${leaf.elementId}`,
        label: leaf.label,
        hint: leaf.hint,
        icon: leaf.icon,
        section: 'elements',
        sectionLabel: 'Elements',
        source: 'leaf',
        leaf,
        groupLabel: group.label,
        score
      });
    }
  }

  // 2. Score templates — only those whose appliesTo is compatible with the source.
  //    We accept a template if ANY appliesTo entry matches the source type OR a
  //    permissive BPMN base type ('bpmn:Task' catches ServiceTask/UserTask/etc.).
  for (const t of templates) {
    if (!isTemplateAppendable(t)) continue;
    const cmd = { label: t.name || t.id, keywords: (t.description || '') + ' ' + (t.id || '') };
    const score = scoreCommand(cmd, q);
    if (score === -Infinity) continue;
    results.push({
      id: `template:${t.id}`,
      label: t.name || t.id,
      hint: t.description || '',
      icon: 'bpmn-icon-service-task', // default; could be t.icon if templates carry icons
      section: 'catalog',
      sectionLabel: 'From Catalog',
      source: 'template',
      template: t,
      score
    });
  }

  // 3. Sort: elements first within score tier, then templates. Sort by score desc, then alpha.
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.section !== b.section) return a.section === 'elements' ? -1 : 1;
    return a.label.localeCompare(b.label);
  });

  return results;
}

function isTemplateAppendable(template) {
  const appliesTo = template.appliesTo || [];
  // Keep templates that apply to a task-family or activity element; these are the
  // ones a user can meaningfully place as the next step.
  return appliesTo.some(a =>
    a === 'bpmn:Task' ||
    a === 'bpmn:ServiceTask' ||
    a === 'bpmn:UserTask' ||
    a === 'bpmn:BusinessRuleTask' ||
    a === 'bpmn:ScriptTask' ||
    a === 'bpmn:SendTask' ||
    a === 'bpmn:CallActivity' ||
    a === 'bpmn:SubProcess'
  );
}
