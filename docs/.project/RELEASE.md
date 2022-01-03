# Release

__[Draft a release](https://github.com/camunda/camunda-modeler/issues/new?body=%23%23+What%27s+inside%3F%0A%0A%3C%21--+link+changelog+if+available+and%2For+a+version+range+%28i.e.+%5B%60v4.9.0...develop%60%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fcompare%2Fv4.9.0...develop%29%29+--%3E%0A%0A*+...%0A*+...%0A*+...%0A%0A%23%23+Release+Checklist%0A%0A_To+be+done+immediately+after+creating+this+issue._%0A%0A*+%5B+%5D+put+up+code+freeze+appointment+in+calendar+%28include+%60modeling%60%2C+%60qa%60%2C+%60infra%60%2C+and+%60Team-Support%60%29%0A*+%5B+%5D+put+up+release+appointment+in+calendar+%28include+%60modeling%60%2C+%60DevRel%60+and+Marketing+%5B+%60Christopher+Rogers%60+%5D%29%0A*+%5B+%5D+add+Slack+role+to+release+manager+%28%60%40modeling-release-manager%60%29%0A%0A_To+be+done+before+the+code+freeze._%0A%0A*+%5B+%5D+inform+QA+about+the+release+and+its+details+so+they+can+prepare+for+testing%0A*+%5B+%5D+Get+in+touch+with+the+team+%28PM%2C+UX+and+Engineering+side%29%2C+to+clarify+what+topics+will+be+included+in+the+Release+and+their+priority.+Use+this+information+to+start+preparing+a+concept+for+the+*blog+post*+%28see+below%29+and+*release+info*+%28see+below%29%0A++++*+%5B+%5D+%28optional%29+if+possible%2C+already+create+feature+branch+to+update+%5BRelease+Info%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fdevelop%2Fclient%2Fsrc%2Fplugins%2Fversion-info%2FReleaseInfo.js%29+following+our+%5Bguidelines%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Fcamunda-modeler%23whats-new-communication%29%0A%0A_To+be+done+after+code+freeze+to+prepare+and+test+the+release._%0A%0A*+%5B+%5D+make+sure+changes+in+upstream+libraries+are+merged+and+released%0A++++*+%60bpmn-js%60%2C+%60dmn-js%60%2C+%60*-properties-panel%60%2C+%60*-moddle%60%2C+%60camunda-bpmn-js%60%2C+%60form-js%60%2C+...%0A*+%5B+%5D+make+sure+dependencies+to+upstream+libraries+are+updated+and+can+be+installed+%28%60rm+-rf+node_modules+%26%26+npm+i+%26%26+npm+run+all%60+works%29%0A*+%5B+%5D+close+all+issues+which+are+solved+by+dependency+updates%0A*+%5B+%5D+smoke+test+to+verify+all+diagrams+can+be+created%0A*+%5B+%5D+update+%5BRelease+Info%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fdevelop%2Fclient%2Fsrc%2Fplugins%2Fversion-info%2FReleaseInfo.js%29%0A++++*+%5B+%5D+create+a+draft+following+%5Bour+guidelines%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Fcamunda-modeler%23whats-new-communication%29+and+based+on+priorities+which+were+aligned+with+the+team+%28PM%2C+UX%2C+and+Engineering+side%29%0A+++*+%5B+%5D+create+PR+to+merge+the+draft+into+%60develop%60.+Assign+to+PM%2C+UX+and+Engineering+for+review%0A*+%5B+%5D+update+%5B%60CHANGELOG%60%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fdevelop%2FCHANGELOG.md%29%0A*+%5B+%5D+verify+%60develop%60+is+up+to+date+with+%60master%60%3A+%60git+checkout+master+%26%26+git+pull+%26%26+git+checkout+develop+%26%26+git+merge+master%60%0A*+%5B+%5D+merge+to+master%3A+%60git+checkout+master+%26%26+git+merge+develop%60%0A*+%5B+%5D+create+release+candidate+%28%60npm+run+release%60%29%2C+cf.+%5Brelease+schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%3B+e.g+%60v1.0.0-rc.0%60%0A++++*+%5B+%5D+wait+for+%5Brelease+build%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Factions%2Fworkflows%2FRELEASE.yml%29+to+create+the+%5Bartifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A*+%5B+%5D+execute+%5Bintegration+test%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2Fdocs%2F.project%2FINTEGRATION_TEST.md%29+on+%5Breleased+artifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A++++*+%5B+%5D+Works+on+Linux%0A++++*+%5B+%5D+Works+on+Mac%0A++++*+%5B+%5D+Works+on+Windows%0A*+%5B+%5D+notify+QA+about+the+release+so+they+can+test+it%0A%0A_To+be+done+to+build+the+release+after+release+testing+completed._%0A%0A*+%5B+%5D+create+release+%28%60npm+run+release%60%29%2C+cf.+%5Brelease+schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%0A++++*+%5B+%5D+wait+for+%5Brelease+build%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Factions%2Fworkflows%2FRELEASE.yml%29+to+create+the+%5Bartifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A%0A_To+be+done+once+the+release+is+built._%0A%0A*+%5B+%5D+publish+release+on+%5BGithub+Releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A*+%5B+%5D+trigger+mirroring+of+release+to+%5BCamunda+Download+Center%5D%28https%3A%2F%2Fdownloads.camunda.cloud%2Frelease%2Fcamunda-modeler%2F%29+via+%5BJenkins%5D%28https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec%29%0A*+%5B+%5D+write+blog+post+for+the+%5BCamunda+Blog%5D%28https%3A%2F%2Fcamunda.com%2Fblog%2F%29%0A+++*+%5B+%5D+duplicate+our+%5Bblog+post+template%5D%28https%3A%2F%2Fcamunda.com%2Fwp-admin%2Fedit.php%3Fs%3DTemplate%2B-%2BCamunda%2BModeler%2BRelease%2BBlog%2BPost%29+via+%60PA+duplicate%60%0A+++*+%5B+%5D+add+your+contents+to+the+newly+created+post%0A+++*+%5B+%5D+set+yourself+as+the+post+author%0A+++*+%5B+%5D+share+the+post+with+your+colleagues+for+review%0A+++*+%5B+%5D+send+the+draft+to+%60Christopher+Rogers%60+to+double+check+it+and+coordinate+publishing%0A*+%5B+%5D+%28if+the+Modeler+UI+appearance+changed%29+update+Camunda+Modeler+screenshots+%28and+potentially+text+content%29+in+the+docs+using+%5Bautomation+scripts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-docs-modeler-screenshots%29%0A*+%5B+%5D+send+all+information+required+to+compile+the+%5Brelease+notice+email%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Fblob%2Fmaster%2Fcamunda-modeler%2FREADME.md%23release-notice-email%29+to+the+%5B%60%40product-release-presentation-dri%60+role%5D%28https%3A%2F%2Fconfluence.camunda.com%2Fpages%2Fviewpage.action%3FspaceKey%3DHAN%26title%3DRelease%2BPresentation%2BProcess%23ReleasePresentationProcess-OrganisingtheReleasePresentation%29%0A*+%5B+%5D+request+marketing+to+update+the+%5Bdownloads+page%5D%28https%3A%2F%2Fcamunda.com%2Fdownload%2Fmodeler%2F%29+via+%5Brequest+form%5D%28https%3A%2F%2Fconfluence.camunda.com%2Fdisplay%2FMAR%2FChange%2Brequest%2Bto%2BDownloads%2Bpage%29%0A*+%5B+%5D+add+new+version+to+%5Bupdate+server+releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server%2Fblob%2Fmaster%2Freleases.json%29%0A%0A_To+be+done+once+release+is+publicly+announced+on+release+day._%0A%0A*+%5B+%5D+publish+release+via+update+server+%28push+to+%60live%60%29%0A*+%5B+%5D+close+%5Bcurrent+milestone%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones%29&title=Release+Camunda+Modeler+vX.X.X&labels=release)__ or head over to [patch release documentation](./PATCH_RELEASE.md).


## Template

A list of activities to perform to cut a Camunda Modeler minor or major release.

For patch releases turn to [this documentation](./PATCH_RELEASE.md).

```markdown
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
* [ ] request marketing to update the [downloads page](https://camunda.com/download/modeler/) via [request form](https://confluence.camunda.com/display/MAR/Change+request+to+Downloads+page)
* [ ] add new version to [update server releases](https://github.com/camunda/camunda-modeler-update-server/blob/master/releases.json)

_To be done once release is publicly announced on release day._

* [ ] publish release via update server (push to `live`)
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```

You may create a blank issue and copy the template into it.
