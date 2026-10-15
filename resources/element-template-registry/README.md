# Element template registry

A small, local element template registry, e.g. to try out custom element
template sources (cf. _Settings > Element template sources_).

## Usage

```sh
node resources/element-template-registry/serve.js [port]
```

This serves the templates in [`./templates`](./templates) over HTTP and prints
the index URL. Add it as a custom element template source (default
`http://localhost:8081/index.json`) and restart the modeler to fetch the
templates.

To test with your own templates, drop additional `.json` files into
`./templates`; the index is rebuilt on every request. Name files
`<template>-<version>.json`, so new versions do not override old ones
(cf. [version property](https://github.com/bpmn-io/element-templates/blob/main/docs/LIFE_CYCLE.md#version-property)).
