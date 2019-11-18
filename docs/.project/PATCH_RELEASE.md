# Patch Release

__[Draft a patch release.](https://github.com/camunda/camunda-modeler/issues/new?title=Release%20Camunda%20Modeler%20vVERSION&body=Release%20Camunda%20Modeler%20%60vVERSION%60%3A%0A%0A%2A%20%5B%20%5D%20make%20sure%20dependencies%20are%20released%20%28%60rm%20-rf%20node_modules%20%26%26%20npm%20i%20%26%26%20npm%20run%20all%60%20works%29%0A%20%20%20%20%2A%20%60bpmn-js%60%2C%20%60dmn-js%60%2C%20%60cmmn-js%60%2C%20%60%2A-properties-panel%60%2C%20%60%2A-moddle%60%2C%20...%0A%2A%20%5B%20%5D%20close%20all%20issues%20which%20are%20solved%20by%20dependency%20updates%0A%2A%20%5B%20%5D%20smoke%20test%20to%20verify%20all%20diagrams%20can%20be%20created%0A%2A%20%5B%20%5D%20update%20CHANGELOG%0A%2A%20%5B%20%5D%20semantic%20release%20%28%60npm%20run%20release%60%29%2C%20cf.%20%5Brelease%20schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%0A%2A%20%5B%20%5D%20wait%20for%20%5BTravis%5D%28https%3A%2F%2Ftravis-ci.org%2Fcamunda%2Fcamunda-modeler%29%20to%20build%20the%20release%0A%2A%20%5B%20%5D%20prepare%20a%20list%20of%20what%20was%20changed%20or%20needs%20to%20be%20tested%0A%2A%20%5B%20%5D%20execute%20integration%20test%2C%20verifying%20fixed%20things%20are%20actually%20fixed%0A%2A%20%5B%20%5D%20%5Boptional%5D%20trigger%20QA%20for%20fuzzy%20testing%0A%2A%20%5B%20%5D%20publish%20release%20on%20%5BGithub%20Releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A%2A%20%5B%20%5D%20trigger%20mirroring%20of%20release%20to%20https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F%20via%20%5BJenkins%5D%28https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec%29%0A%2A%20%5B%20%5D%20update%20download%20version%20of%20Camunda%20Modeler%20at%20%5Bcamunda.com%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda.com-new%2Fblob%2Flive%2Fdata%2Freleases.json%29%0A%2A%20%5B%20%5D%20close%20%5Bcurrent%20milestone%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones%29&labels=release)__

## Template / Checklist

A list of things to perform with Camunda Modeler patch release. 

You may create a blank issue and copy the template below into it.

```markdown
Release Camunda Modeler `vVERSION`:

* [ ] make sure dependencies are released (`rm -rf node_modules && npm i && npm run all` works)
    * `bpmn-js`, `dmn-js`, `cmmn-js`, `*-properties-panel`, `*-moddle`, ...
* [ ] close all issues which are solved by dependency updates
* [ ] smoke test to verify all diagrams can be created
* [ ] update CHANGELOG
* [ ] semantic release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema)
* [ ] wait for [Travis](https://travis-ci.org/camunda/camunda-modeler) to build the release
* [ ] prepare a list of what was changed or needs to be tested
* [ ] execute integration test, verifying fixed things are actually fixed
* [ ] [optional] trigger QA for fuzzy testing
* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to https://camunda.org/release/camunda-modeler/ via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] update download version of Camunda Modeler at [camunda.com](https://github.com/camunda/camunda.com-new/blob/live/data/releases.json)
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```
