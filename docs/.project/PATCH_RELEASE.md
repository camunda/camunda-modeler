# Patch Release

__[Draft a patch release.](https://github.com/camunda/camunda-modeler/issues/new?body=%23%23+What%27s+inside%3F%0A%0A%3C%21--+link+changelog+if+available+and%2For+a+version+range+%28i.e.+%5B%60v4.9.0...develop%60%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fcompare%2Fv4.9.0...develop%29%29+--%3E%0A%0A*+...%0A*+...%0A*+...%0A%0A%0A%23%23+Release+Checklist%0A%0A_To+be+done+immediately+after+creating+this+issue._%0A%0A*+%5B+%5D+add+Slack+role+to+release+manager+%28%60%40modeling-release-manager%60%29%0A%0A_To+be+done+to+prepare+and+build+the+release._%0A%0A*+%5B+%5D+make+sure+changes+in+upstream+libraries+are+merged+and+released%0A++++*+%60bpmn-js%60%2C+%60dmn-js%60%2C+%60*-properties-panel%60%2C+%60*-moddle%60%2C+%60camunda-bpmn-js%60%2C+%60form-js%60%2C+...%0A*+%5B+%5D+make+sure+dependencies+to+upstream+libraries+are+updated+and+can+be+installed+%28%60rm+-rf+node_modules+%26%26+npm+i+%26%26+npm+run+all%60+works%29%0A*+%5B+%5D+close+all+issues+which+are+solved+by+dependency+updates%0A*+%5B+%5D+smoke+test+to+verify+all+diagrams+can+be+created%0A*+%5B+%5D+update+%5BRelease+Info%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2Fclient%2Fsrc%2Fplugins%2Fversion-info%2FReleaseInfo.js%29%0A*+%5B+%5D+update+%5B%60CHANGELOG%60%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2FCHANGELOG.md%29%0A*+%5B+%5D+create+release+%28%60npm+run+release%60%29%2C+cf.+%5Brelease+schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%0A++++*+%5B+%5D+wait+for+%5Brelease+build%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Factions%2Fworkflows%2FRELEASE.yml%29+to+create+the+%5Bartifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A*+%5B+%5D+prepare+a+list+of+what+was+changed+or+needs+to+be+tested%0A*+%5B+%5D+execute+integration+test%2C+verifying+fixed+things+are+actually+fixed%0A*+%5B+%5D+optionally+trigger+QA+for+testing%0A%0A_To+be+done+to+make+the+release+publicly+available._%0A%0A*+%5B+%5D+publish+release+on+%5BGithub+Releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0A*+%5B+%5D+trigger+mirroring+of+release+to+%5BCamunda+Download+Center%5D%28https%3A%2F%2Fdownloads.camunda.cloud%2Frelease%2Fcamunda-modeler%2F%29+via+%5BJenkins%5D%28https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec%29%0A*+%5B+%5D+request+marketing+to+update+the+%5Bdownloads+page%5D%28https%3A%2F%2Fcamunda.com%2Fdownload%2Fmodeler%2F%29+via+%5Brequest+form%5D%28https%3A%2F%2Fconfluence.camunda.com%2Fdisplay%2FMAR%2FChange%2Brequest%2Bto%2BDownloads%2Bpage%29%0A*+%5B+%5D+add+new+version+to+%5Bupdate+server+releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server%2Fblob%2Fmaster%2Freleases.json%29%0A*+%5B+%5D+publish+release+via+update+server+%28push+to+%60live%60%29&title=Release+Camunda+Modeler+vX.X.X&labels=release)__

## Template

A list of things to perform to cut a Camunda Modeler patch release.

```markdown
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
* [ ] smoke test to verify all diagrams can be created
* [ ] update [Release Info](https://github.com/camunda/camunda-modeler/blob/master/client/src/plugins/version-info/ReleaseInfo.js)
* [ ] update [`CHANGELOG`](https://github.com/camunda/camunda-modeler/blob/master/CHANGELOG.md)
* [ ] create release (`npm run release`), cf. [release schema](https://github.com/bpmn-io/internal-docs/tree/master/release-schema)
    * [ ] wait for [release build](https://github.com/camunda/camunda-modeler/actions/workflows/RELEASE.yml) to create the [artifacts](https://github.com/camunda/camunda-modeler/releases)
* [ ] prepare a list of what was changed or needs to be tested
* [ ] execute integration test, verifying fixed things are actually fixed
* [ ] optionally trigger QA for testing

_To be done to make the release publicly available._

* [ ] publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] trigger mirroring of release to [Camunda Download Center](https://downloads.camunda.cloud/release/camunda-modeler/) via [Jenkins](https://ci.cambpm.camunda.cloud/job/sideprojects/job/camunda-modeler-desktop-RELEASE/build?delay=0sec)
* [ ] request marketing to update the [downloads page](https://camunda.com/download/modeler/) via [request form](https://confluence.camunda.com/display/MAR/Change+request+to+Downloads+page)
* [ ] add new version to [update server releases](https://github.com/camunda/camunda-modeler-update-server/blob/master/releases.json)
* [ ] publish release via update server (push to `live`)
```

You may create a blank issue and copy the template into it.
