---
name: Release
about: Create a new release checklist.
labels:
- release
---

## What's inside?

<!-- link changelog, version range (i.e. [`v4.9.0...develop`](https://github.com/camunda/camunda-modeler/compare/v4.9.0...develop)), [milestoned tasks](https://tasks.bpmn.io/board/?c=%21Inbox%2C%21Done&s=milestone%3A%22M77%22) -->

<!-- ensure that a list of changes is provided to make testing easier -->

* ...
* ...
* ...

## Release Checklist

_To be done when the release manager is assigned._

* [ ] communicate the code freeze to the team
  * [ ] create a calendar event
  * [ ] announce the code freeze in the [#team-modeling-group](https://camunda.slack.com/archives/C032H77434N) Slack channel

_To be done before the code freeze._

* [ ] inform QA about the release and its details so they can prepare for testing
* [ ] get in touch with the team (PM, UX and Engineering side), to clarify what topics will be included in the Release and their priority. Use this information to start preparing a concept for the _blog post_ (see below) and _release info_ (see below)
  * [ ] (optional) if possible, already create a PR to update [Release Info](https://github.com/camunda/camunda-modeler/blob/develop/client/src/plugins/version-info/ReleaseInfo.js) following our [guidelines](https://github.com/bpmn-io/internal-docs/blob/main/releases/modeler/CAMUNDA_MODELER.md#whats-new-communication)

_To be done after code freeze to prepare and test the release._

* [ ] make sure changes in upstream libraries are merged and released
  * `bpmn-js`, `dmn-js`, `*-properties-panel`, `*-moddle`, `camunda-bpmn-js`, `form-js`, ...
* [ ] make sure potential new engine versions are available and marked correctly (alpha/stable)
* [ ] make sure dependencies to upstream libraries are updated and can be installed (`rm -rf node_modules && npm i && npm run all` works)
* [ ] verify `develop` is up to date with `main`: `git checkout main && git pull && git checkout develop && git merge main`
* [ ] close all issues which are solved by dependency updates
* [ ] ensure that the modeler is free of major security vulnerabilities via `npm audit`
* [ ] smoke test to verify all diagrams can be created
* [ ] update [Release Info](https://github.com/camunda/camunda-modeler/blob/develop/client/src/plugins/version-info/ReleaseInfo.js)
  * [ ] create a draft following [our guidelines](https://github.com/bpmn-io/internal-docs/blob/main/releases/modeler/CAMUNDA_MODELER.md#whats-new-communication) and based on priorities which were aligned with the team (PM, UX, and Engineering side)
  * [ ] create PR to merge the draft into `develop`. Assign to PM, UX and Engineering for review
* [ ] update [`CHANGELOG`](https://github.com/camunda/camunda-modeler/blob/develop/CHANGELOG.md)
* [ ] compile a list of blog worthy changes as input to [release blog](https://confluence.camunda.com/pages/viewpage.action?pageId=178590449)
* [ ] merge to main: `git checkout main && git merge develop`
* [ ] create release candidate (`npm run release:rc -- [preminor|premajor|prepatch]`), cf. [release schema](https://github.com/bpmn-io/internal-docs/blob/main/releases/RELEASE_SCHEMA.md)
  * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/main/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://github.com/camunda/camunda-modeler/releases)
  * [ ] Works on Linux
  * [ ] Works on Mac
  * [ ] Works on Windows
* [ ] notify QA about the release so they can test it

_To be done to build the release after release testing completed._

* [ ] create release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/blob/main/releases/RELEASE_SCHEMA.md)
  * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)

_To be done once the release is built._

* [ ] communicate release with closed support-related issues to [#ask-support](https://camunda.slack.com/archives/CHAC0L80M) (automated)
* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] communicate the release to [support](https://app.slack.com/client/T0PM0P1SA/CHAC0L80M) (changelog link, closed support issues; [example message](https://camunda.slack.com/archives/CHAC0L80M/p1733480373630349))
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)

_To be done as a post-release activity._

* [ ] update Camunda Modeler screenshots (and potentially text content) in the docs by running [screenshots workflow](https://github.com/camunda/camunda-docs-modeler-screenshots/actions/workflows/CREATE_SCREENSHOTS.yml). Download artifacts and create PRs for:
  * [ ] [camunda-docs-static](https://github.com/camunda/camunda-docs-static)
  * [ ] [camunda-docs-manual](https://github.com/camunda/camunda-docs-manual)
  * [ ] [camunda-docs](https://github.com/camunda/camunda-docs)
* [ ] provide content to the [release presentation and notice](https://confluence.camunda.com/x/Uq-gBQ#ReleasePresentationProcess-OrganisingtheReleasePresentation)
* [ ] trigger [downloads page](https://camunda.com/download/modeler/) update via [marketing request form](https://confluence.camunda.com/x/rTGSBg)
* [ ] add new version to [update server releases](https://github.com/camunda/camunda-modeler-update-server/blob/main/releases.json)
* [ ] (optional) update [supported environments page](https://docs.camunda.io/docs/reference/supported-environments/)

_To be done once release is publicly announced on release day._

* [ ] publish release via update server (push to `live`)
* [ ] announce the release via the Camunda internal [#c8-release-announcements](https://camunda.slack.com/archives/C03NFMH4KC6) channel
