# Template updater semantics

How the application updates element templates, and caches them over time.

## Index processing

The updater reads the index as an object whose keys are template identifiers
and whose values are arrays of version metadata. It evaluates every metadata
entry; it does not select only the latest version.

The updater matches files found in the index against templates found in the 
local template file, i.e. `resources/element-templates/.camunda-connector-templates.json` 
for OOTB connector templates. 

Templates that don't exist in the local cache or have `ref` changed are re-fetched.

## Determining compatibility

An entry is compatible when either:

* its `engine` property is absent; or
* `engine.camunda` is absent; or
* the configured execution-platform version, after semver coercion, satisfies
  the `engine.camunda` semver range.

`engine` may carry constraints for other platforms, but the updater evaluates
only `engine.camunda` and ignores any other keys.

## Fetching and caching templates

Compatible, uncached entries are fetched from `ref`, with at most six
concurrent fetches. The response must be successful and parse as JSON.

Fetched templates replace an existing local template when the fetched
template's own `id` and `version` match. Otherwise, they are appended. Existing
templates not present in the index are retained. Consequently, the local file
is additive rather than a mirror of the index, and its existing ordering is
preserved while newly fetched templates are appended in index iteration order.

The updater writes the resulting array after a successful index response,
including when no templates were fetched. 

## Failures

Fetch failures are indicated as warnings to the users:

* A failed template fetch or template JSON parse leaves the corresponding local
  template unchanged while other entries continue to be processed.
* A failed index update leaves local templates unchanged
