# Custom element-template sources

Desktop Modeler can fetch Camunda 8 element templates from HTTP(S) index URLs in addition to the OOTB connector templates from Camunda Marketplace.

## Configure sources

1. Open __Settings → Element templates__.
2. Use __OOTB connector templates__ to enable or disable the built-in source independently of your custom sources.
3. Select __Add source__ and enter an index URL. Add further URLs in the desired order.
4. Restart Modeler to apply additions, edits, removals, or changes to the OOTB toggle. Open a Camunda 8 diagram to fetch templates compatible with its engine version.

The index must be reachable without configured credentials. HTTP and HTTPS, including network-reachable internal servers, are supported. There is no authentication, token, or custom-header configuration; embedded username/password values are rejected. Do not put secrets in URLs: fetch warnings can include the URL.

Settings autosaves drafts, including invalid URLs. Invalid entries are indicated inline and skipped at startup; they do not prevent valid sources from loading. Leading/trailing whitespace and URL fragments do not identify different sources. Repeated normalized custom URLs are ignored after their first occurrence; query parameters remain significant.

The ordered URL array is stored as `app.customTemplateSources` in `settings.json`. The OOTB toggle retains the existing `app.disableConnectorTemplates` setting and `disable-connector-templates` flag.

## Index format

Use the same index format as Marketplace, not an embedded template or template array:

```json
{
  "io.camunda.example.custom-source": [
    {
      "version": 1,
      "ref": "https://example.com/templates/task-v1.json",
      "engine": { "camunda": ">=8.8" }
    }
  ]
}
```

Each entry describes a non-negative integer version, an absolute reference URL, and an engine compatibility object (possibly `{}`). The referenced template must match that ID, version, and compatibility and be a valid Camunda 8 element template. Only Camunda compatibility is evaluated. All compatible versions are fetched, not just the latest.

The existing contract is documented in [PR #6172](https://github.com/camunda/camunda-modeler/pull/6172):

* [Index format](https://raw.githubusercontent.com/camunda/camunda-modeler/353b9d8ae40b6c251969c96336b42d6521d541cb/docs/template-updater/index-format.md)
* [Index schema](https://raw.githubusercontent.com/camunda/camunda-modeler/353b9d8ae40b6c251969c96336b42d6521d541cb/docs/template-updater/index-schema.json)
* [Update semantics](https://raw.githubusercontent.com/camunda/camunda-modeler/353b9d8ae40b6c251969c96336b42d6521d541cb/docs/template-updater/update-semantics.md)

These links pin the reviewed specification; this feature does not introduce another index format or validation engine.

## Source priority

OOTB has the lowest priority. Custom sources follow in Settings order: __the bottom source wins for matching template ID + version__.

For example, OOTB provides `foo` versions 1, 2, and 3, and a custom source provides `foo` version 2. The available definitions are OOTB versions 1 and 3 plus the custom version 2. Different versions do not override one another.

This rule only resolves conflicts between active managed remote cache files. Manually installed, project-local, and config-based templates retain existing loading and duplicate-validation behavior. Duplicate definitions within a single source are not deduplicated during loading.

Selection happens before normal renderer filtering and validation. A winning definition with a recognized Camunda 8 schema receives normal validation; if invalid, it does not fall back to an earlier definition. Missing or unrecognized Camunda 8 `$schema` values retain the existing filtering behavior and may disappear without a validation warning. Existing Camunda 7 schema classification is unchanged.

## Caching and removal

Custom sources have independent hidden cache files under `<user-data>/resources/element-templates/`, named `.custom-element-templates-<SHA-256 of normalized URL>.json`. The OOTB cache keeps its existing filename.

* Fetch failures warn and preserve the source's cached data. Other sources can still update.
* Editing a URL selects a different cache unless its normalized URL is unchanged.
* Removing a source stops fetching and loading its cache after restart. Its file is __retained__, and re-adding the same URL can reuse it. An earlier source's cached definition becomes visible again when its override is removed.
* Removing entries from a still-configured index does not remove cached templates. Updates remain additive, so such entries can continue to override earlier sources.
* References are cached. To publish changed template contents, change the corresponding index `ref`; editing the response at an unchanged reference is not enough.
* Existing update timing is unchanged: same-count cache replacements do not immediately trigger an editor reload. A normal focus/reload/restart can observe the changed contents.

There is no automatic disk cleanup in this feature. Destructive cleanup of inactive caches is deferred for maintainer feedback, not performed on removal.

## Try it locally

From the repository root, serve the integration-test fixtures:

```sh
python3 -m http.server 8123 --bind 127.0.0.1 --directory app/lib/template-updater/__tests__/fixtures/custom-sources
```

In another terminal, start Modeler:

```sh
npm run dev
```

1. Add `http://127.0.0.1:8123/source-a.json`, then `http://127.0.0.1:8123/source-b.json` in Settings and restart.
2. Open a Camunda 8 diagram using version 8.8 or later. Source A's version 1 and source B's version 2 should be available. Source A's version 2 must not create a duplicate-template error.
3. Disable OOTB and restart. Both custom versions remain available.
4. Remove source B and restart. Source A's version 2 returns; B's hidden cache remains on disk. Re-add B and restart to restore its override.
5. With both sources active and cached, stop the HTTP server and reopen the diagram. Warnings should identify the failed URLs, while cached templates remain usable.
6. Remove both sources and restart. Neither custom source is loaded; unrelated locally installed templates are unaffected.

For a validation check, serve source B's version 2 from a __new reference URL__, keeping its recognized Camunda 8 `$schema` but removing the required `name`. With A then B configured, reopen the diagram, let the fetch finish, and switch focus away and back. The normal validation error should appear without restoring A's overridden version 2. Restore the valid fixture afterward.
