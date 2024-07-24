## What's inside?

<!-- link changelog if available and/or a version range (i.e. [`v4.9.0...develop`](https://github.com/camunda/camunda-modeler/compare/v4.9.0...develop)) -->

* ...
* ...
* ...

## Release Checklist

_To be done immediately after creating this issue._

* [ ] add Slack role to release manager (`@modeling-release-manager`)

_To be done to prepare and build the release._

* [ ] make sure changes in upstream libraries are merged and released
  * `bpmn-js`, `dmn-js`, `*-properties-panel`, `*-moddle`, `camunda-bpmn-js`, `form-js`, ...
* [ ] make sure dependencies to upstream libraries are updated and can be installed (`rm -rf node_modules && npm i && npm run all` works)
* [ ] close all issues which are solved by dependency updates
* [ ] ensure that the modeler is free of major security vulnerabilities via `npm audit`
* [ ] smoke test to verify all diagrams can be created
* [ ] update [Release Info](https://github.com/camunda/camunda-modeler/blob/master/client/src/plugins/version-info/ReleaseInfo.js)
* [ ] update [`CHANGELOG`](https://github.com/camunda/camunda-modeler/blob/master/CHANGELOG.md)
* [ ] create release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema)
  * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)
* [ ] prepare a list of what was changed or needs to be tested
* [ ] execute integration test, verifying fixed things are actually fixed
* [ ] (optional) trigger QA for testing

_To be done to make the release publicly available._

* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger [downloads page](https://camunda.com/download/modeler/) update via [marketing request form](https://confluence.camunda.com/display/MAR/Marketing+Request+Form)
* [ ] add new version to [update server releases](https://github.com/camunda/camunda-modeler-update-server/blob/master/releases.json)
* [ ] publish release via update server (push to `live`)

_To be done post release._

* [ ] communicate closed support related issues to [#ask-support](https://camunda.slack.com/archives/CHAC0L80M)
