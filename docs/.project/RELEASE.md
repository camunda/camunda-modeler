# Release

__[Draft a release](https://github.com/camunda/camunda-modeler/issues/new?body=%23%23%20What's%20inside%3F%0A%0A*%20...%0A*%20...%0A*%20...%0A%0A%0A%23%23%20Release%20Checklist%0A%0A_To%20be%20done%20immediately%20after%20creating%20this%20issue._%0A%0A*%20%5B%20%5D%20put%20up%20code%20freeze%20appointment%20in%20calendar%20(include%20%60modeling%60%2C%20%60qa%60%2C%20%60infra%60%2C%20and%20%60Team-Support%60)%0A*%20%5B%20%5D%20schedule%20a%20meeting%20to%20inform%20QA%20about%20the%20release%20and%20its%20details%20so%20they%20can%20prepare%20for%20testing%0A*%20%5B%20%5D%20put%20up%20release%20appointment%20in%20calendar%20(include%20%60modeling%60%2C%20%60DevRel%60%20and%20Marketing%20%5B%20%60Christopher%20Rogers%60%20%5D)%0A*%20%5B%20%5D%20add%20Slack%20role%20to%20release%20manager%20(%60%40modeling-release-manager%60)%0A%0A_To%20be%20done%20after%20code%20freeze%20and%20prior%20to%20the%20release%20day%20to%20prepare%20and%20build%20the%20release._%0A%0A*%20%5B%20%5D%20make%20sure%20changes%20in%20upstream%20libraries%20are%20merged%20and%20released%0A%20%20%20%20*%20%60bpmn-js%60%2C%20%60dmn-js%60%2C%20%60*-properties-panel%60%2C%20%60*-moddle%60%2C%20%60camunda-bpmn-js%60%2C%20%60form-js%60%2C%20...%0A*%20%5B%20%5D%20make%20sure%20dependencies%20to%20upstream%20libraries%20are%20updated%20and%20can%20be%20installed%20(%60rm%20-rf%20node_modules%20%26%26%20npm%20i%20%26%26%20npm%20run%20all%60%20works)%0A*%20%5B%20%5D%20close%20all%20issues%20which%20are%20solved%20by%20dependency%20updates%0A*%20%5B%20%5D%20verify%20%60develop%60%20is%20up%20to%20date%20with%20%60master%60%3A%20%60git%20checkout%20master%20%26%26%20git%20pull%20%26%26%20git%20checkout%20develop%20%26%26%20git%20merge%20master%60%0A*%20%5B%20%5D%20smoke%20test%20to%20verify%20all%20diagrams%20can%20be%20created%0A*%20%5B%20%5D%20update%20%5BRelease%20Info%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fdevelop%2Fclient%2Fsrc%2Fplugins%2Fversion-info%2FReleaseInfo.js)%0A*%20%5B%20%5D%20update%20CHANGELOG%0A*%20%5B%20%5D%20merge%20to%20master%3A%20%60git%20checkout%20master%20%26%26%20git%20merge%20develop%60%0A*%20%5B%20%5D%20create%20release%20candidate%20(%60npm%20run%20release%60)%2C%20e.g.%20v1.0.0-rc.0%0A%20%20%20%20*%20%5B%20%5D%20wait%20for%20%5BTravis%5D(https%3A%2F%2Ftravis-ci.com%2Fcamunda%2Fcamunda-modeler)%20to%20build%20the%20executables%0A*%20%5B%20%5D%20execute%20%5Bintegration%20test%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2Fdocs%2F.project%2FINTEGRATION_TEST.md)%20on%20%5Breleased%20artifacts%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases)%0A%20%20%20%20*%20%5B%20%5D%20Works%20on%20Linux%0A%20%20%20%20*%20%5B%20%5D%20Works%20on%20Mac%0A%20%20%20%20*%20%5B%20%5D%20Works%20on%20Windows%0A*%20%5B%20%5D%20notify%20QA%20about%20the%20release%20so%20they%20can%20test%20it%0A*%20%5B%20%5D%20write%20blog%20post%20for%20the%20%5BCamunda%20Blog%5D(https%3A%2F%2Fcamunda.com%2Fblog%2F)%0A%20%20%20*%20%5B%20%5D%20create%20a%20draft%20post%20on%20Wordpress%0A%20%20%20*%20%5B%20%5D%20send%20the%20draft%20to%20%60Christopher%20Rogers%60%20to%20coordinate%20the%20publishing%0A*%20%5B%20%5D%20(if%20the%20Modeler%20UI%20appearance%20changed)%20update%20Camunda%20Modeler%20screenshots%20(and%20potentially%20text%20content)%20in%20the%20docs%20using%20%5Bautomation%20scripts%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-docs-modeler-screenshots)%0A%0A_To%20be%20done%20after%20integration%20test%20was%20successful%20or%20if%20not%20issues%20were%20fixed._%0A%0A*%20%5B%20%5D%20create%20release%20(%60npm%20run%20release%60)%2C%20cf.%20%5Brelease%20schema%5D(https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema)%0A%20%20%20%20*%20%5B%20%5D%20wait%20for%20%5BTravis%5D(https%3A%2F%2Ftravis-ci.com%2Fcamunda%2Fcamunda-modeler)%20to%20build%20the%20executables%0A*%20%5B%20%5D%20send%20all%20information%20required%20to%20compile%20the%20%5Brelease%20notice%20email%5D(https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Fblob%2Fmaster%2Fcamunda-modeler%2FREADME.md%23release-notice-email)%20to%20the%20%5B%60%40product-release-presentation-dri%60%20role%5D(https%3A%2F%2Fconfluence.camunda.com%2Fpages%2Fviewpage.action%3FspaceKey%3DcamBPM%26title%3DRelease%2BPresentation%2BOrganization)%0A*%20%5B%20%5D%20reach%20out%20to%20%60David%20Paradis%60%20so%20that%20he%20updates%20download%20version%20of%20%5BCamunda%20Modeler%5D(https%3A%2F%2Fcamunda.com%2Fde%2Fdownload%2Fmodeler%2F)%20on%20release%20day%0A%0A_To%20be%20done%20on%20release%20day%20to%20announce%20the%20release%20and%20making%20it%20publically%20available._%0A%0A*%20%5B%20%5D%20publish%20release%20on%20%5BGithub%20Releases%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases)%0A*%20%5B%20%5D%20trigger%20mirroring%20of%20release%20to%20https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F%20via%20%5BJenkins%5D(https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec)%0A*%20%5B%20%5D%20add%20new%20version%20to%20%5Bupdates-server%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server)%20releases%20JSON%20file.%20Merge%20this%20file%20to%20master%2Flive%20branches.%0A*%20%5B%20%5D%20close%20%5Bcurrent%20milestone%5D(https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones)&title=Release+Camunda+Modeler+vX.X.X&labels=release)__ or head over to [patch release documentation](./PATCH_RELEASE.md).


## Template

A list of activities to perform to cut a Camunda Modeler minor or major release.

For patch releases turn to [this documentation](./PATCH_RELEASE.md).

```markdown
## What's inside?

* ...
* ...
* ...


## Release Checklist

_To be done immediately after creating this issue._

* [ ] put up code freeze appointment in calendar (include `modeling`, `qa`, `infra`, and `Team-Support`)
* [ ] schedule a meeting to inform QA about the release and its details so they can prepare for testing
* [ ] put up release appointment in calendar (include `modeling`, `DevRel` and Marketing [ `Christopher Rogers` ])
* [ ] add Slack role to release manager (`@modeling-release-manager`)

_To be done after code freeze and prior to the release day to prepare and build the release._

* [ ] make sure changes in upstream libraries are merged and released
    * `bpmn-js`, `dmn-js`, `*-properties-panel`, `*-moddle`, `camunda-bpmn-js`, `form-js`, ...
* [ ] make sure dependencies to upstream libraries are updated and can be installed (`rm -rf node_modules && npm i && npm run all` works)
* [ ] close all issues which are solved by dependency updates
* [ ] verify `develop` is up to date with `master`: `git checkout master && git pull && git checkout develop && git merge master`
* [ ] smoke test to verify all diagrams can be created
* [ ] update [Release Info](https://github.com/camunda/camunda-modeler/blob/develop/client/src/plugins/version-info/ReleaseInfo.js)
* [ ] update CHANGELOG
* [ ] merge to master: `git checkout master && git merge develop`
* [ ] create release candidate (`npm run release`), e.g. v1.0.0-rc.0
    * [ ] wait for [Travis](https://travis-ci.com/camunda/camunda-modeler) to build the executables
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/master/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://github.com/camunda/camunda-modeler/releases)
    * [ ] Works on Linux
    * [ ] Works on Mac
    * [ ] Works on Windows
* [ ] notify QA about the release so they can test it
* [ ] write blog post for the [Camunda Blog](https://camunda.com/blog/)
   * [ ] create a draft post on Wordpress
   * [ ] send the draft to `Christopher Rogers` to coordinate the publishing
* [ ] (if the Modeler UI appearance changed) update Camunda Modeler screenshots (and potentially text content) in the docs using [automation scripts](https://github.com/camunda/camunda-docs-modeler-screenshots)

_To be done after integration test was successful or if not issues were fixed._

* [ ] create release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema)
    * [ ] wait for [Travis](https://travis-ci.com/camunda/camunda-modeler) to build the executables
* [ ] send all information required to compile the [release notice email](https://github.com/bpmn-io/internal-docs/blob/master/camunda-modeler/README.md#release-notice-email) to the [`@product-release-presentation-dri` role](https://confluence.camunda.com/pages/viewpage.action?spaceKey=camBPM&title=Release+Presentation+Organization)
* [ ] reach out to `David Paradis` so that he updates download version of [Camunda Modeler](https://camunda.com/de/download/modeler/) on release day

_To be done on release day to announce the release and making it publically available._

* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to https://camunda.org/release/camunda-modeler/ via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] add new version to [updates-server](https://github.com/camunda/camunda-modeler-update-server) releases JSON file. Merge this file to master/live branches.
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```

You may create a blank issue and copy the template into it.
