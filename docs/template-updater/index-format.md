# Index format

The index is a JSON object. Each property name identifies an element template
and maps to an array of all published metadata versions for that template. The
index does not contain the templates themselves; each metadata entry points to
a template document through `ref`.

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
  ],
  ...
}
```

## Metadata fields

| Field | Type | Meaning |
| --- | --- | --- |
| Template identifier | Non-empty object property name | Groups the available versions of one template |
| `version` | Integer, 0 or greater | Element-template version |
| `ref` | URI string | Location of the element-template JSON document |
| `engine` | Object | Execution-platform compatibility constraints; it may be empty |
| `engine.camunda` | Optional string | Semver range of compatible Camunda execution-platform versions |

`engine` may carry multiple constraints keyed by platform. `version` and `ref` must
be provided.

## Well-formed index

Beyond matching the schema, an index MUST be consistent with the referenced
documents:

* Index key equals the referenced template's own `id`;
* `version` equals the referenced template's own `version`;
* `ref` resolves to a valid element-template JSON document; and
* `engine` describes the referenced template's actual compatibility.

[`index-schema.json`](./index-schema.json) is the normative definition of the
format.
