# Additional `deployResources` / `.c8ignore` fixtures

Desktop Modeler cases in the format of the shared [parity fixtures](../deploy-resources-parity/README.md),
supplementing them. Cases prefixed `c8ignore-` cover projects without `deployResources`, limited to
`.bpmn`, `.dmn` and `.form` files which both tools discover by default.

Decisions encoded here, beyond the shared fixtures:

* A leading `/`, a drive letter, and any `..` segment are invalid, also in negated patterns.
* Invalid JSON in `camunda.json` is an `invalid-config` error.
* `.c8ignore` keeps c8ctl's current engine behavior: a negation cannot re-include a path below an
  excluded directory, and this applies to the default exclusions too, so `!target/` does not
  restore `target/` (verified against c8ctl `origin/main` `src/utils/shared/ignore.ts`).
