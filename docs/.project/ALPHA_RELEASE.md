# Alpha Release

__[Draft an alpha release](https://github.com/camunda/camunda-modeler/issues/new?body=%23%23+What+is+inside%3F%0A%0A*+...%0A*+...%0A*+...%0A%0A%0A%23%23+Release+Checklist%0A%0A_To+be+done+immediately+after+creating+this+issue._%0A%0A*+%5B+%5D+put+up+code+freeze+appointment+in+calendar+%28include+%60modeling%60%2C+%60qa%60%2C+%60infra%60%2C+and+%60Team-Support%60%29%0A*+%5B+%5D+add+Slack+role+to+release+manager+%28%60%40modeling-release-manager%60%29%0A%0A_To+be+done+after+code+freeze+and+prior+to+the+release+day+to+prepare+and+build+the+release._%0A%0A*+%5B+%5D+make+sure+changes+in+upstream+libraries+are+merged+and+released%0A++++*+%60bpmn-js%60%2C+%60dmn-js%60%2C+%60cmmn-js%60%2C+%60*-properties-panel%60%2C+%60*-moddle%60%2C+...%0A*+%5B+%5D+make+sure+dependencies+to+upstream+libraries+are+updated+and+can+be+installed+%28%60rm+-rf+node_modules+%26%26+npm+i+%26%26+npm+run+all%60+works%29%0A*+%5B+%5D+close+all+issues+which+are+solved+by+dependency+updates%0A*+%5B+%5D+verify+%60develop%60+is+up+to+date+with+%60master%60%3A+%60git+checkout+master+%26%26+git+pull+%26%26+git+checkout+develop+%26%26+git+merge+master%60%0A*+%5B+%5D+smoke+test+to+verify+all+diagrams+can+be+created%0A*+%5B+%5D+update+CHANGELOG%0A*+%5B+%5D+semantic+release+%28%60npm+run+release%60%29+from+%60develop%60%2C+cf.+%5Brelease+schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%0A*+%5B+%5D+wait+for+%5BTravis%5D%28https%3A%2F%2Ftravis-ci.org%2Fcamunda%2Fcamunda-modeler%29+to+build+the+release%0A*+%5B+%5D+execute+%5Bintegration+test%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2Fdocs%2F.project%2FINTEGRATION_TEST.md%29+on+%5Breleased+artifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A++++*+%5B+%5D+Works+on+Linux%0A++++*+%5B+%5D+Works+on+Mac%0A++++*+%5B+%5D+Works+on+Windows%0A*+%5B+%5D+trigger+QA+for+fuzzy+testing%0A*+%5B+%5D+write+blog+post+for+%5Bblog.camunda.org%5D%28https%3A%2F%2Fcamunda.com%2Fblog%2F%29+according+to+%5Bthis+process%5D%28https%3A%2F%2Fconfluence.camunda.com%2Fpages%2Fviewpage.action%3FspaceKey%3DMAR%26title%3DYour%2BContent%2Bon%2Bthe%2BCamunda%2BBlog%29%0A+++*+%5B+%5D+copy+and+paste+%5Bthis+template%5D%28https%3A%2F%2Fdocs.google.com%2Fdocument%2Fd%2F18aXWFBdbET97EZ_HO1DEVLVsYP-UQEabumSzQdeRbDw%2Fedit%3Fusp%3Dsharing%29+to+a+new+docs+file+in+%5BModeling+blog+posts%5D%28https%3A%2F%2Fdrive.google.com%2Fdrive%2Fu%2F1%2Ffolders%2F1Kw3lo2zbl3HL7w6y19A3S9SdpAdrDcFJ%29%0A+++*+%5B+%5D+write+a+draft+version+of+the+blog+post%0A+++*+%5B+%5D+send+it+to+Charley+Mann+and+Christopher+Rogers+for+review+and+ask+them+to+coordinate+the+publishing%0A%0A_To+be+done+on+release+day+to+announce+the+release+and+making+it+publically+available._%0A%0A*+%5B+%5D+publish+release+on+%5BGithub+Releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A*+%5B+%5D+trigger+mirroring+of+release+to+https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F+via+%5BJenkins%5D%28https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec%29%0A*+%5B+%5D+spread+the+word%0A++++*+%5B+%5D+send+%5Brelease+notice+email%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Fblob%2Fmaster%2Fcamunda-modeler%2FREADME.md%23release-notice-email%29%0A++++*+%5B+%5D+tweet%0A*+%5B+%5D+add+new+version+to+%5Bupdates-server%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server%29+releases+JSON+file.+Merge+this+file+to+master%2Flive+branches.%0A*+%5B+%5D+close+%5Bcurrent+milestone%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones%29&title=Release+Camunda+Modeler+vX.X.X-alphaX&labels=release)__ or head over to:
* [patch release documentation](./PATCH_RELEASE.md), or
* [minor and major release documentation](./RELEASE.md).


## Template

A list of activities to perform to cut a Camunda Modeler alpha release.

For minor or major releases turn to [this documentation](./RELEASE.md), while for patch releases turn to [that documentation](./PATCH_RELEASE.md).

```markdown
## What is inside?

* ...
* ...
* ...


## Release Checklist

_To be done immediately after creating this issue._

* [ ] put up code freeze appointment in calendar (include `modeling`, `qa`, `infra`, and `Team-Support`)
* [ ] add Slack role to release manager (`@modeling-release-manager`)

_To be done after code freeze and prior to the release day to prepare and build the release._

* [ ] make sure changes in upstream libraries are merged and released
    * `bpmn-js`, `dmn-js`, `cmmn-js`, `*-properties-panel`, `*-moddle`, ...
* [ ] make sure dependencies to upstream libraries are updated and can be installed (`rm -rf node_modules && npm i && npm run all` works)
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
* [ ] write blog post for [blog.camunda.org](https://camunda.com/blog/) according to [this process](https://confluence.camunda.com/pages/viewpage.action?spaceKey=MAR&title=Your+Content+on+the+Camunda+Blog)
   * [ ] copy and paste [this template](https://docs.google.com/document/d/18aXWFBdbET97EZ_HO1DEVLVsYP-UQEabumSzQdeRbDw/edit?usp=sharing) to a new docs file in [Modeling blog posts](https://drive.google.com/drive/u/1/folders/1Kw3lo2zbl3HL7w6y19A3S9SdpAdrDcFJ)
   * [ ] write a draft version of the blog post
   * [ ] send it to Charley Mann and Christopher Rogers for review and ask them to coordinate the publishing

_To be done on release day to announce the release and making it publically available._

* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to https://camunda.org/release/camunda-modeler/ via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] spread the word
    * [ ] send [release notice email](https://github.com/bpmn-io/internal-docs/blob/master/camunda-modeler/README.md#release-notice-email)
    * [ ] tweet
* [ ] add new version to [updates-server](https://github.com/camunda/camunda-modeler-update-server) releases JSON file. Merge this file to master/live branches.
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```

You may create a blank issue and copy the template into it.
