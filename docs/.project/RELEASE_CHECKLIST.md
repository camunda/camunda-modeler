# Release Checklist

A list of things to perform with every minor or major Camunda Modeler release. Please use [this list](./PATCH_RELEASE_CHECKLIST.md) for patch releases.

__Hint:__ Create a release issue and copy the template below into it.


```markdown
* [ ] put up code freeze appointment in calendar (include `modeling`, `qa`, `sre`, and `Team-Support`)
* [ ] make sure dependencies are released (`rm -rf node_modules && npm i && npm run all` works)
    * `bpmn-js`, `dmn-js`, `cmmn-js`, `*-properties-panel`, `*-moddle`, ...
* [ ] close all issues which are solved by dependency updates
* [ ] verify `develop` is up to date with `master`: `git checkout master && git pull && git checkout develop && git merge master`
* [ ] smoke test to verify all diagrams can be created
* [ ] update CHANGELOG
* [ ] semantic release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema)
* [ ] merge to master: `git checkout master && git merge develop`
* [ ] wait for [Travis](https://travis-ci.org/camunda/camunda-modeler) to build the release
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/master/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://github.com/camunda/camunda-modeler/releases)
    * [ ] Works on Linux
    * [ ] Works on Mac
    * [ ] Works on Windows
* [ ] trigger QA for fuzzy testing
* [ ] write blog post for [blog.camunda.org](https://github.com/camunda/blog.camunda.org), __do not publish until released version is available for download on [camunda.org](https://camunda.org/release/camunda-modeler/)__
* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to https://camunda.org/release/camunda-modeler/ via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] update download version of Camunda Modeler at [camunda.com](https://github.com/camunda/camunda.com-new/blob/live/data/releases.json)
* [ ] publish blog post on [blog.camunda.org](https://github.com/camunda/blog.camunda.org)
* [ ] spread the word
    * [ ] send [release notice email](https://github.com/bpmn-io/internal-docs/blob/master/camunda-modeler/README.md#release-notice-email)
    * [ ] tweet
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```
