# Release

__[Draft a release](https://github.com/camunda/camunda-modeler/issues/new?body=%0A%23%23%20What%27s%20inside%3F%0A%0A%3C%21--%20link%20changelog%20if%20available%20and%2For%20a%20version%20range%20%28i.e.%20%5B%60v4.9.0...develop%60%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fcompare%2Fv4.9.0...develop%29%29%20--%3E%0A%0A%2A%20...%0A%2A%20...%0A%2A%20...%0A%0A%0A%23%23%20Release%20Checklist%0A%0A_To%20be%20done%20immediately%20after%20creating%20this%20issue._%0A%0A%2A%20%5B%20%5D%20put%20up%20code%20freeze%20appointment%20in%20calendar%20%28include%20%60modeling%60%2C%20%60qa%60%2C%20%60infra%60%2C%20and%20%60Team-Support%60%29%0A%2A%20%5B%20%5D%20put%20up%20release%20appointment%20in%20calendar%20%28include%20%60modeling%60%2C%20%60DevRel%60%20and%20Marketing%20%5B%20%60Christopher%20Rogers%60%20%5D%29%0A%2A%20%5B%20%5D%20add%20Slack%20role%20to%20release%20manager%20%28%60%40modeling-release-manager%60%29%0A%0A_To%20be%20done%20before%20the%20code%20freeze._%0A%0A%2A%20%5B%20%5D%20inform%20QA%20about%20the%20release%20and%20its%20details%20so%20they%20can%20prepare%20for%20testing%0A%2A%20%5B%20%5D%20Get%20in%20touch%20with%20the%20team%20%28PM%2C%20UX%20and%20Engineering%20side%29%2C%20to%20clarify%20what%20topics%20will%20be%20included%20in%20the%20Release%20and%20their%20priority.%20Use%20this%20information%20to%20start%20preparing%20a%20concept%20for%20the%20%2Ablog%20post%2A%20%28see%20below%29%20and%20%2Arelease%20info%2A%20%28see%20below%29%0A%20%20%20%20%2A%20%5B%20%5D%20%28optional%29%20if%20possible%2C%20already%20create%20feature%20branch%20to%20update%20%5BRelease%20Info%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fdevelop%2Fclient%2Fsrc%2Fplugins%2Fversion-info%2FReleaseInfo.js%29%20following%20our%20%5Bguidelines%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Fcamunda-modeler%23whats-new-communication%29%0A%0A_To%20be%20done%20after%20code%20freeze%20to%20prepare%20and%20test%20the%20release._%0A%0A%2A%20%5B%20%5D%20make%20sure%20changes%20in%20upstream%20libraries%20are%20merged%20and%20released%0A%20%20%20%20%2A%20%60bpmn-js%60%2C%20%60dmn-js%60%2C%20%60%2A-properties-panel%60%2C%20%60%2A-moddle%60%2C%20%60camunda-bpmn-js%60%2C%20%60form-js%60%2C%20...%0A%2A%20%5B%20%5D%20make%20sure%20dependencies%20to%20upstream%20libraries%20are%20updated%20and%20can%20be%20installed%20%28%60rm%20-rf%20node_modules%20%26%26%20npm%20i%20%26%26%20npm%20run%20all%60%20works%29%0A%2A%20%5B%20%5D%20close%20all%20issues%20which%20are%20solved%20by%20dependency%20updates%0A%2A%20%5B%20%5D%20smoke%20test%20to%20verify%20all%20diagrams%20can%20be%20created%0A%2A%20%5B%20%5D%20update%20%5BRelease%20Info%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fdevelop%2Fclient%2Fsrc%2Fplugins%2Fversion-info%2FReleaseInfo.js%29%0A%20%20%20%20%2A%20%5B%20%5D%20create%20a%20draft%20following%20%5Bour%20guidelines%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Fcamunda-modeler%23whats-new-communication%29%20and%20based%20on%20priorities%20which%20were%20aligned%20with%20the%20team%20%28PM%2C%20UX%2C%20and%20Engineering%20side%29%0A%20%20%20%2A%20%5B%20%5D%20create%20PR%20to%20merge%20the%20draft%20into%20%60develop%60.%20Assign%20to%20PM%2C%20UX%20and%20Engineering%20for%20review%0A%2A%20%5B%20%5D%20update%20%5B%60CHANGELOG%60%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fdevelop%2FCHANGELOG.md%29%0A%2A%20%5B%20%5D%20verify%20%60develop%60%20is%20up%20to%20date%20with%20%60master%60%3A%20%60git%20checkout%20master%20%26%26%20git%20pull%20%26%26%20git%20checkout%20develop%20%26%26%20git%20merge%20master%60%0A%2A%20%5B%20%5D%20merge%20to%20master%3A%20%60git%20checkout%20master%20%26%26%20git%20merge%20develop%60%0A%2A%20%5B%20%5D%20create%20release%20candidate%20%28%60npm%20run%20release%60%29%2C%20cf.%20%5Brelease%20schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%3B%20e.g%20%60v1.0.0-rc.0%60%0A%20%20%20%20%2A%20%5B%20%5D%20wait%20for%20%5Brelease%20build%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Factions%2Fworkflows%2FRELEASE.yml%29%20to%20create%20the%20%5Bartifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A%2A%20%5B%20%5D%20execute%20%5Bintegration%20test%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2Fdocs%2F.project%2FINTEGRATION_TEST.md%29%20on%20%5Breleased%20artifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A%20%20%20%20%2A%20%5B%20%5D%20Works%20on%20Linux%0A%20%20%20%20%2A%20%5B%20%5D%20Works%20on%20Mac%0A%20%20%20%20%2A%20%5B%20%5D%20Works%20on%20Windows%0A%2A%20%5B%20%5D%20notify%20QA%20about%20the%20release%20so%20they%20can%20test%20it%0A%0A_To%20be%20done%20to%20build%20the%20release%20after%20release%20testing%20completed._%0A%0A%2A%20%5B%20%5D%20create%20release%20%28%60npm%20run%20release%60%29%2C%20cf.%20%5Brelease%20schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%0A%20%20%20%20%2A%20%5B%20%5D%20wait%20for%20%5Brelease%20build%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Factions%2Fworkflows%2FRELEASE.yml%29%20to%20create%20the%20%5Bartifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A%0A_To%20be%20done%20once%20the%20release%20is%20built._%0A%0A%2A%20%5B%20%5D%20publish%20release%20on%20%5BGithub%20Releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A%2A%20%5B%20%5D%20trigger%20mirroring%20of%20release%20to%20%5BCamunda%20Download%20Center%5D%28https%3A%2F%2Fdownloads.camunda.cloud%2Frelease%2Fcamunda-modeler%2F%29%20via%20%5BJenkins%5D%28https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec%29%0A%2A%20%5B%20%5D%20write%20blog%20post%20for%20the%20%5BCamunda%20Blog%5D%28https%3A%2F%2Fcamunda.com%2Fblog%2F%29%0A%20%20%20%2A%20%5B%20%5D%20duplicate%20our%20%5Bblog%20post%20template%5D%28https%3A%2F%2Fcamunda.com%2Fwp-admin%2Fedit.php%3Fs%3DTemplate%2B-%2BCamunda%2BModeler%2BRelease%2BBlog%2BPost%29%20via%20%60PA%20duplicate%60%0A%20%20%20%2A%20%5B%20%5D%20add%20your%20contents%20to%20the%20newly%20created%20post%0A%20%20%20%2A%20%5B%20%5D%20set%20yourself%20as%20the%20post%20author%0A%20%20%20%2A%20%5B%20%5D%20share%20the%20post%20with%20your%20colleagues%20for%20review%0A%20%20%20%2A%20%5B%20%5D%20send%20the%20draft%20to%20%60Christopher%20Rogers%60%20to%20double%20check%20it%20and%20coordinate%20publishing%0A%2A%20%5B%20%5D%20%28if%20the%20Modeler%20UI%20appearance%20changed%29%20update%20Camunda%20Modeler%20screenshots%20%28and%20potentially%20text%20content%29%20in%20the%20docs%20using%20%5Bautomation%20scripts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-docs-modeler-screenshots%29%0A%2A%20%5B%20%5D%20send%20all%20information%20required%20to%20compile%20the%20%5Brelease%20notice%20email%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Fblob%2Fmaster%2Fcamunda-modeler%2FREADME.md%23release-notice-email%29%20to%20the%20%5B%60%40product-release-presentation-dri%60%20role%5D%28https%3A%2F%2Fconfluence.camunda.com%2Fpages%2Fviewpage.action%3FspaceKey%3DHAN%26title%3DRelease%2BPresentation%2BProcess%23ReleasePresentationProcess-OrganisingtheReleasePresentation%29%0A%2A%20%5B%20%5D%20reach%20out%20to%20%60David%20Paradis%60%20so%20that%20he%20updates%20download%20version%20of%20%5BCamunda%20Modeler%5D%28https%3A%2F%2Fcamunda.com%2Fde%2Fdownload%2Fmodeler%2F%29%20on%20release%20day%0A%2A%20%5B%20%5D%20add%20new%20version%20to%20%5Bupdate%20server%20releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server%2Fblob%2Fmaster%2Freleases.json%29%0A%0A_To%20be%20done%20once%20release%20is%20publicly%20announced%20on%20release%20day._%0A%0A%2A%20%5B%20%5D%20publish%20release%20via%20update%20server%20%28push%20to%20%60live%60%29%0A%2A%20%5B%20%5D%20close%20%5Bcurrent%20milestone%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones%29%0A&title=Release+Camunda+Modeler+vX.X.X&labels=release&title=Release+Camunda+Modeler+vX.X.X&labels=release)__ or head over to [patch release documentation](./PATCH_RELEASE.md).


## Template

A list of activities to perform to cut a Camunda Modeler minor or major release.

For patch releases turn to [this documentation](./PATCH_RELEASE.md).

```markdown
## What's inside?

<!-- link changelog if available and/or a version range (i.e. [`v4.9.0...develop`](https://github.com/camunda/camunda-modeler/compare/v4.9.0...develop)) -->

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
* [ ] Get in touch with the team (PM, UX and Engineering side), to clarify what topics will be included in the Release and their priority. Use this information to start preparing a concept for the *blog post* (see below) and *release info* (see below)
    * [ ] (optional) if possible, already create feature branch to update [Release Info](https://github.com/camunda/camunda-modeler/blob/develop/client/src/plugins/version-info/ReleaseInfo.js) following our [guidelines](https://github.com/bpmn-io/internal-docs/tree/master/camunda-modeler#whats-new-communication)

_To be done after code freeze to prepare and test the release._

* [ ] make sure changes in upstream libraries are merged and released
    * `bpmn-js`, `dmn-js`, `*-properties-panel`, `*-moddle`, `camunda-bpmn-js`, `form-js`, ...
* [ ] make sure dependencies to upstream libraries are updated and can be installed (`rm -rf node_modules && npm i && npm run all` works)
* [ ] close all issues which are solved by dependency updates
* [ ] smoke test to verify all diagrams can be created
* [ ] update [Release Info](https://github.com/camunda/camunda-modeler/blob/develop/client/src/plugins/version-info/ReleaseInfo.js)
    * [ ] create a draft following [our guidelines](https://github.com/bpmn-io/internal-docs/tree/master/camunda-modeler#whats-new-communication) and based on priorities which were aligned with the team (PM, UX, and Engineering side)
   * [ ] create PR to merge the draft into `develop`. Assign to PM, UX and Engineering for review
* [ ] update [`CHANGELOG`](https://github.com/camunda/camunda-modeler/blob/develop/CHANGELOG.md)
* [ ] verify `develop` is up to date with `master`: `git checkout master && git pull && git checkout develop && git merge master`
* [ ] merge to master: `git checkout master && git merge develop`
* [ ] create release candidate (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema); e.g `v1.0.0-rc.0`
    * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/master/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://github.com/camunda/camunda-modeler/releases)
    * [ ] Works on Linux
    * [ ] Works on Mac
    * [ ] Works on Windows
* [ ] notify QA about the release so they can test it

_To be done to build the release after release testing completed._

* [ ] create release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema)
    * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)

_To be done once the release is built._

* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to [Camunda Download Center](https://downloads.camunda.cloud/release/camunda-modeler/) via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] write blog post for the [Camunda Blog](https://camunda.com/blog/)
   * [ ] duplicate our [blog post template](https://camunda.com/wp-admin/edit.php?s=Template+-+Camunda+Modeler+Release+Blog+Post) via `PA duplicate`
   * [ ] add your contents to the newly created post
   * [ ] set yourself as the post author
   * [ ] share the post with your colleagues for review
   * [ ] send the draft to `Christopher Rogers` to double check it and coordinate publishing
* [ ] (if the Modeler UI appearance changed) update Camunda Modeler screenshots (and potentially text content) in the docs using [automation scripts](https://github.com/camunda/camunda-docs-modeler-screenshots)
* [ ] send all information required to compile the [release notice email](https://github.com/bpmn-io/internal-docs/blob/master/camunda-modeler/README.md#release-notice-email) to the [`@product-release-presentation-dri` role](https://confluence.camunda.com/pages/viewpage.action?spaceKey=HAN&title=Release+Presentation+Process#ReleasePresentationProcess-OrganisingtheReleasePresentation)
* [ ] reach out to `David Paradis` so that he updates download version of [Camunda Modeler](https://camunda.com/de/download/modeler/) on release day
* [ ] add new version to [update server releases](https://github.com/camunda/camunda-modeler-update-server/blob/master/releases.json)

_To be done once release is publicly announced on release day._

* [ ] publish release via update server (push to `live`)
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```

You may create a blank issue and copy the template into it.
