---
name: Release
about: Create a new release checklist.
labels:
- release
---
## What's inside?

<!-- link changelog if available and/or a version range (i.e. [`v4.9.0...develop`](https://github.com/camunda/camunda-modeler/compare/v4.9.0...develop)) -->
<!-- ensure that a list of changes is provided to make testing easier -->

* ...
* ...
* ...


## Release Checklist

_To be done immediately after creating this issue._

* [ ] put up code freeze appointment in calendar (include `modeling`, `qa`, `infra`, and `Team-Support`)
* [ ] put up release appointment in calendar (include `modeling`, `DevRel` and Marketing [ `Christopher Rogers` ])
* [ ] add Slack role to release manager (`@modeling-release-manager`)

_To be done before the code freeze._

* [ ] inform QA about the release and its details so they can prepare for testing
* [ ] get in touch with the team (PM, UX and Engineering side), to clarify what topics will be included in the Release and their priority. Use this information to start preparing a concept for the *blog post* (see below) and *release info* (see below)
    * [ ] (optional) if possible, already create feature branch to update [Release Info](https://github.com/camunda/camunda-modeler/blob/develop/client/src/plugins/version-info/ReleaseInfo.js) following our [guidelines](https://github.com/bpmn-io/internal-docs/blob/master/releases/modeler/CAMUNDA_MODELER.md#whats-new-communication)

_To be done after code freeze to prepare and test the release._

* [ ] make sure changes in upstream libraries are merged and released
    * `bpmn-js`, `dmn-js`, `*-properties-panel`, `*-moddle`, `camunda-bpmn-js`, `form-js`, ...
* [ ] make sure dependencies to upstream libraries are updated and can be installed (`rm -rf node_modules && npm i && npm run all` works)
* [ ] close all issues which are solved by dependency updates
* [ ] smoke test to verify all diagrams can be created
* [ ] update [Release Info](https://github.com/camunda/camunda-modeler/blob/develop/client/src/plugins/version-info/ReleaseInfo.js)
    * [ ] create a draft following [our guidelines](https://github.com/bpmn-io/internal-docs/blob/master/releases/modeler/CAMUNDA_MODELER.md#whats-new-communication) and based on priorities which were aligned with the team (PM, UX, and Engineering side)
   * [ ] create PR to merge the draft into `develop`. Assign to PM, UX and Engineering for review
* [ ] update [`CHANGELOG`](https://github.com/camunda/camunda-modeler/blob/develop/CHANGELOG.md)
* [ ] verify `develop` is up to date with `master`: `git checkout master && git pull && git checkout develop && git merge master`
* [ ] merge to master: `git checkout master && git merge develop`
* [ ] create release candidate (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/blob/master/releases/RELEASE_SCHEMA.md); e.g `v1.0.0-rc.0`
    * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/master/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://github.com/camunda/camunda-modeler/releases)
    * [ ] Works on Linux
    * [ ] Works on Mac
    * [ ] Works on Windows
* [ ] notify QA about the release so they can test it

_To be done to build the release after release testing completed._

* [ ] create release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/blob/master/releases/RELEASE_SCHEMA.md)
    * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)

_To be done once the release is built._

* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to [Camunda Download Center](https://downloads.camunda.cloud/release/camunda-modeler/) via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] write blog post for the [Camunda Blog](https://camunda.com/blog/), [see guidelines](https://confluence.camunda.com/display/HAN/Your+Content+on+the+Camunda+Blog)
   * [ ] use the [blog post template](https://docs.google.com/document/d/18aXWFBdbET97EZ_HO1DEVLVsYP-UQEabumSzQdeRbDw/edit?usp=sharing)
   * [ ] add your contents to the newly created post
   * [ ] set yourself as the post author
   * [ ] share the post with your colleagues for review
   * [ ] send the draft to `Christopher Rogers` to double check it and coordinate publishing
* [ ] update Camunda Modeler screenshots (and potentially text content) in the docs by running [screenshots workflow](https://github.com/camunda/camunda-docs-modeler-screenshots/actions/workflows/createScreenshots.yml). Download artifacts and create PRs for:
   * [ ] [camunda-docs-static](https://github.com/camunda/camunda-docs-static)
   * [ ] [camunda-docs-manual](https://github.com/camunda/camunda-docs-manual)
   * [ ] [camunda-docs-platform](https://github.com/camunda/camunda-platform-docs)
* [ ] send all information required to compile the [release notice email](https://github.com/bpmn-io/internal-docs/blob/master/releases/modeler/CAMUNDA_MODELER.md#release-notice-email) to the [`@product-release-presentation-dri` role](https://confluence.camunda.com/pages/viewpage.action?spaceKey=HAN&title=Release+Presentation+Process#ReleasePresentationProcess-OrganisingtheReleasePresentation)
* [ ] request marketing to update the [downloads page](https://camunda.com/download/modeler/) via [request form](https://confluence.camunda.com/display/MAR/Marketing+Request+Form)
* [ ] add new version to [update server releases](https://github.com/camunda/camunda-modeler-update-server/blob/master/releases.json)

_To be done once release is publicly announced on release day._

* [ ] publish release via update server (push to `live`)
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
