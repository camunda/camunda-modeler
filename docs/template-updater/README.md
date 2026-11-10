# Template updating — developer guide

Camunda Modeler has the ability to do background fetching of element templates 
from remote sources. Today, the mechanism is used for [automatic OOTB connector template
fetching](https://docs.camunda.io/docs/components/modeler/desktop-modeler/use-connectors/#automatic-connector-template-fetching) where the Camunda Marketplace serves the 
reference index:

```text
GET https://marketplace.cloud.camunda.io/api/v1/ootb-connectors
```

The index maps each element-template identifier to its available versions, and
each version points to a template document through `ref`:

```json
{
  "io.camunda.example.v1": [
    {
      "version": 2,
      "ref": "https://example.com/element-template.json",
      "engine": {
        "camunda": "^8.10"
      }
    }
  ]
}
```

[The mechanism](../../app/lib/template-updater/template-updater.js) can be extended to serve / fetch element templates from any endpoint.

## Further resources

| Resource | Purpose |
| --- | --- |
| [`index-format.md`](./index-format.md) | The index format: fields and well-formedness rules |
| [`index-schema.json`](./index-schema.json) | Normative JSON Schema (Draft 2020-12) of the index format |
| [`update-semantics.md`](./update-semantics.md) | How Camunda Modeler fetches, caches, filters, persists, and handles failures |
