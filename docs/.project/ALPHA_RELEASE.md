# Release

__[Draft a release](https://github.com/camunda/camunda-modeler/issues/new?title=Release%20Camunda%20Modeler%20vVERSION&body=Release%20Camunda%20Modeler%20%60vVERSION%60.%0A%0A%23%23%23%23%20What%20is%20inside%3F%0A%0A%2A%20%0A%2A%20%0A%0A%0A%23%23%23%23%20Release%20Checklist%0A%0A*%20%5B%20%5D%20put%20up%20code%20freeze%20appointment%20in%20calendar%20(include%20%60modeling%60%2C%20%60qa%60%2C%20%60infra%60%2C%20and%20%60Team-Support%60)%0A*%20%5B%20%5D%20make%20sure%20dependencies%20are%20released%20(%60rm%20-rf%20node_modules%20%26%26%20npm%20i%20%26%26%20npm%20run%20all%60%20works)%0A%20%20%20%20*%20%60bpmn-js%60%2C%20%60dmn-js%60%2C%20%60cmmn-js%60%2C%20%60*-properties-panel%60%2C%20%60*-moddle%60%2C%20...%0A*%20%5B%20%5D%20close%20all%20issues%20which%20are%20solved%20by%20dependency%20updates%0A*%20%5B%20%5D%20verify%20%60develop%60%20is%20up%20to%20date%20with%20%60master%60%3A%20%60git%20checkout%20master%20%26%26%20git%20pull%20%26%26%20git%20checkout%20develop%20%26%26%20git%20merge%20master%60%0A*%20%5B%20%5D%20smoke%20test%20to%20verify%20all%20diagrams%20can%20be%20created%0A*%20%5B%20%5D%20update%20CHANGELOG%0A*%20%5B%20%5D%20semantic%20release%20(%60npm%20run%20release%60)%20from%20%60develop%60%2C%20cf.%20%5Brelease%20schema%5D(https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema)%0A*%20%5B%20%5D%20wait%20for%20%5BTravis%5D(https%3A%2F%2Ftravis-ci.org%2Fcamunda%2Fcamunda-modeler)%20to%20build%20the%20release%0A*%20%5B%20%5D%20execute%20%5Bintegration%20test%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2Fdocs%2F.project%2FINTEGRATION_TEST.md)%20on%20%5Breleased%20artifacts%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases)%0A%20%20%20%20*%20%5B%20%5D%20Works%20on%20Linux%0A%20%20%20%20*%20%5B%20%5D%20Works%20on%20Mac%0A%20%20%20%20*%20%5B%20%5D%20Works%20on%20Windows%0A*%20%5B%20%5D%20trigger%20QA%20for%20fuzzy%20testing%0A*%20%5B%20%5D%20write%20blog%20post%20for%20%5Bblog.camunda.org%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fblog.camunda.org)%2C%20__do%20not%20publish%20until%20released%20version%20is%20available%20for%20download%20on%20%5Bcamunda.org%5D(https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F)__%0A*%20%5B%20%5D%20publish%20release%20on%20%5BGithub%20Releases%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases)%0A*%20%5B%20%5D%20trigger%20mirroring%20of%20release%20to%20https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F%20via%20%5BJenkins%5D(https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec)%0A*%20%5B%20%5D%20publish%20blog%20post%20on%20%5Bblog.camunda.org%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fblog.camunda.org)%0A*%20%5B%20%5D%20spread%20the%20word%0A%20%20%20%20*%20%5B%20%5D%20send%20%5Brelease%20notice%20email%5D(https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Fblob%2Fmaster%2Fcamunda-modeler%2FREADME.md%23release-notice-email)%0A%20%20%20%20*%20%5B%20%5D%20tweet%0A*%20%5B%20%5D%20add%20new%20version%20to%20%5Bupdates-server%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server)%20releases%20JSON%20file.%20Merge%20this%20file%20to%20master%2Flive%20branches.%0A*%20%5B%20%5D%20close%20%5Bcurrent%20milestone%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones)&labels=release)__ or head over to:
* [patch release documentation](./PATCH_RELEASE.md), or
* [minor and major release documentation](./RELEASE.md).


## Template

A list of activities to perform to cut a Camunda Modeler alpha release.

For minor or major releases turn to [this documentation](./RELEASE.md), while for patch releases turn to [that documentation](./PATCH_RELEASE.md).

```markdown
Release Camunda Modeler `vVERSION`.

#### What is inside?

* 
* 


#### Release Checklist

* [ ] put up code freeze appointment in calendar (include `modeling`, `qa`, `infra`, and `Team-Support`)
* [ ] make sure dependencies are released (`rm -rf node_modules && npm i && npm run all` works)
    * `bpmn-js`, `dmn-js`, `cmmn-js`, `*-properties-panel`, `*-moddle`, ...
* [ ] close all issues which are solved by dependency updates
* [ ] verify `develop` is up to date with `master`: `git checkout master && git pull && git checkout develop && git merge master`
* [ ] smoke test to verify all diagrams can be created
* [ ] update CHANGELOG
* [ ] semantic release (`npm run release`) from `develop`, cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema)
* [ ] wait for [Travis](https://travis-ci.org/camunda/camunda-modeler) to build the release
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/master/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://github.com/camunda/camunda-modeler/releases)
    * [ ] Works on Linux
    * [ ] Works on Mac
    * [ ] Works on Windows
* [ ] trigger QA for fuzzy testing
* [ ] write blog post for [blog.camunda.org](https://github.com/camunda/blog.camunda.org), __do not publish until released version is available for download on [camunda.org](https://camunda.org/release/camunda-modeler/)__
* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to https://camunda.org/release/camunda-modeler/ via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] publish blog post on [blog.camunda.org](https://github.com/camunda/blog.camunda.org)
* [ ] spread the word
    * [ ] send [release notice email](https://github.com/bpmn-io/internal-docs/blob/master/camunda-modeler/README.md#release-notice-email)
    * [ ] tweet
* [ ] add new version to [updates-server](https://github.com/camunda/camunda-modeler-update-server) releases JSON file. Merge this file to master/live branches.
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```

You may create a blank issue and copy the template into it.
