# `deployResources` parity fixtures

Tool-agnostic fixtures that pin how a Camunda project's resource set is
resolved from `camunda.json`, with and without `deployResources`. c8ctl and
Desktop Modeler must produce the same result for every case. The folder is
self-contained: copy it as-is into another repository.

## Layout

```
deploy-resources-parity/
  <case-name>/
    files.txt       project files to create (one per line)
    camunda.json    the project descriptor, copied verbatim
    expected.json   the expected outcome
    [other files]   optional literal files (for example .c8ignore), copied verbatim
```

## Build a case

1. Create an empty temporary directory. This is the **project root**.
2. Copy every file in the case folder **except** `files.txt` and
   `expected.json` into the project root, keeping relative paths. This
   always includes `camunda.json`, and some cases add a `.c8ignore`.
3. For each non-blank line of `files.txt`, create an **empty** file at that
   project-relative path. Paths use `/` separators. Create parent directories
   as needed, including hidden ones (`.git/`, `.github/`) and default-excluded
   ones (`node_modules/`, `target/`). These directories are not committed as
   real files because git cannot track `.git/`, and repositories usually
   ignore `node_modules/` and `target/`.
4. Resolve the project's resource set from the project root.

Fixtures contain no symlinks, so they work the same on every OS.

## `expected.json`

```json
{
  "description": "what the case demonstrates",
  "spec": "the specification sentence the case pins",
  "selected": ["project/relative/path.bpmn", "..."]
}
```

or, for a case that must fail without deploying anything:

```json
{ "description": "...", "spec": "...", "error": "invalid-config" }
```

- `selected` lists project-relative paths with `/` separators. Comparison is
  order-insensitive; the list is sorted for readability.
- `error` is one of:
  - `invalid-config`: wrong field type, a wrong entry type, or an invalid
    pattern (empty, a bare `!`, a `#` comment, absolute, or containing `..`).
  - `empty-selection`: the final selection is empty.

  Tools word their own messages; only the error class must match.

## Case groups

| Prefix / case | What it pins |
| :-- | :-- |
| `worked-example` | The specification's worked example. |
| `allowlist-*`, `negation`, `ordered-overrides` | Allowlist start, `!` deselection, last match wins. |
| `defaults-*`, `broad-wildcard*`, `explicit-file-below-default-exclusion` | Default exclusions (`node_modules/`, `target/`, `.git/`, root `camunda.json`) and how a matching positive pattern overrides them. |
| `hidden-*` | Hidden-file rule. |
| `descendant-reinclusion` | Positive patterns select descendants directly and re-include below an excluded directory. |
| `gitignore-syntax`, `repeated-separator`, `dot-segment` | Syntax inherited from the `.c8ignore` engine. Repeated `/` separators and inner `.` segments are collapsed by the matcher, and directory discovery must agree with it. |
| `unmatched-pattern-ignored`, `c8ignore-ignored-when-field-present`, `c8ignore-unreadable-when-field-present`, `nested-project-not-excluded` | Ignored inputs. With `deployResources`, `.c8ignore` is not read at all, so a directory named `.c8ignore` does no harm. |
| `invalid-*`, `empty-*` | Validation errors. |
| `absent-field-*` | No `deployResources`. The default c8ctl scan applies: extensions `.bpmn`, `.dmn`, `.form`; hidden files skipped, hidden directories scanned; `node_modules/`, `target/`, `.git/` excluded; filtered by `.c8ignore` with gitignore semantics, including the excluded-parent rule. |

## Matching rules these fixtures encode

- Patterns use the `.c8ignore` engine: the gitignore subset compiled to
  `node:path` `matchesGlob` globs, relative to the project root with `/`
  separators.
  - An unanchored name matches at any depth.
  - An embedded `/` anchors the pattern to the project root.
  - `dir/` and `dir` select the directory's contents.
  - `dir/**` selects the contents only.
- Selection starts empty. Patterns apply in order and the last match wins per
  file. There is no gitignore excluded-parent rule.
- `node_modules/`, `target/`, `.git/` and the root `camunda.json` behave as
  implicit `!` patterns placed **before** the user's patterns. Any later
  positive pattern that matches a file inside them therefore selects it, for
  example `**/*`, `*.bpmn`, or an explicit path.
- Dot segments: wildcards (`*`, `?`, `**`, `[...]`) never match a path
  segment that starts with `.`. This applies to directory segments as well as
  file names; it is the default `dot: false` glob behaviour.
  - A dot-prefixed file is selected only by a pattern that spells out the
    leading `.` for that segment, such as `resources/.prompt.md` or
    `**/.agent.md`.
  - A file inside a dot-prefixed directory is selected only by a pattern that
    names that directory, such as `.camunda/**`.
  - Tools still walk into hidden directories so that such explicit patterns
    can reach them.
