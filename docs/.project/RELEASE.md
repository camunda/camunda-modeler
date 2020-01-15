# Release

__[Draft a release](https://github.com/camunda/camunda-modeler/issues/new?title=Release%20Camunda%20Modeler%20vVERSION&body=%0ARelease+Camunda+Modeler+%60vVERSION%60%0D%0A%0D%0A%2A+%5B+%5D+put+up+code+freeze+appointment+in+calendar+%28include+%60modeling%60%2C+%60qa%60%2C+%60sre%60%2C+and+%60Team-Support%60%29%0D%0A%2A+%5B+%5D+make+sure+dependencies+are+released+%28%60rm+-rf+node_modules+%26%26+npm+i+%26%26+npm+run+all%60+works%29%0D%0A++++%2A+%60bpmn-js%60%2C+%60dmn-js%60%2C+%60cmmn-js%60%2C+%60%2A-properties-panel%60%2C+%60%2A-moddle%60%2C+...%0D%0A%2A+%5B+%5D+close+all+issues+which+are+solved+by+dependency+updates%0D%0A%2A+%5B+%5D+verify+%60develop%60+is+up+to+date+with+%60master%60%3A+%60git+checkout+master+%26%26+git+pull+%26%26+git+checkout+develop+%26%26+git+merge+master%60%0D%0A%2A+%5B+%5D+smoke+test+to+verify+all+diagrams+can+be+created%0D%0A%2A+%5B+%5D+update+CHANGELOG%0D%0A%2A+%5B+%5D+semantic+release+%28%60npm+run+release%60%29%2C+cf.+%5Brelease+schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%0D%0A%2A+%5B+%5D+merge+to+master%3A+%60git+checkout+master+%26%26+git+merge+develop%60%0D%0A%2A+%5B+%5D+wait+for+%5BTravis%5D%28https%3A%2F%2Ftravis-ci.org%2Fcamunda%2Fcamunda-modeler%29+to+build+the+release%0D%0A%2A+%5B+%5D+execute+%5Bintegration+test%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fblob%2Fmaster%2Fdocs%2F.project%2FINTEGRATION_TEST.md%29+on+%5Breleased+artifacts%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0D%0A++++%2A+%5B+%5D+Works+on+Linux%0D%0A++++%2A+%5B+%5D+Works+on+Mac%0D%0A++++%2A+%5B+%5D+Works+on+Windows%0D%0A%2A+%5B+%5D+trigger+QA+for+fuzzy+testing%0D%0A%2A+%5B+%5D+write+blog+post+for+%5Bblog.camunda.org%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fblog.camunda.org%29%2C+__do+not+publish+until+released+version+is+available+for+download+on+%5Bcamunda.org%5D%28https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F%29__%0D%0A%2A+%5B+%5D+publish+release+on+%5BGithub+Releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0D%0A%2A+%5B+%5D+trigger+mirroring+of+release+to+https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F+via+%5BJenkins%5D%28https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec%29%0D%0A%2A+%5B+%5D+update+download+version+of+Camunda+Modeler+at+%5Bcamunda.com%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda.com-new%2Fblob%2Flive%2Fdata%2Freleases.json%29%0D%0A%2A+%5B+%5D+publish+blog+post+on+%5Bblog.camunda.org%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fblog.camunda.org%29%0D%0A%2A+%5B+%5D+spread+the+word%0D%0A++++%2A+%5B+%5D+send+%5Brelease+notice+email%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Fblob%2Fmaster%2Fcamunda-modeler%2FREADME.md%23release-notice-email%29%0D%0A++++%2A+%5B+%5D+tweet%0D%0A%2A+%5B+%5D+add+new+version+to+%5Bupdates-server%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server%29+releases+JSON+file.+Merge+this+file+to+master%2Flive+branches.%0D%0A%2A+%5B+%5D+close+%5Bcurrent+milestone%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones%29&labels=release)__ or head over to [patch release documentation](./PATCH_RELEASE.md).


## Template

A list of activities to perform to cut a Camunda Modeler minor or major release.

For patch releases turn to [this documentation](./PATCH_RELEASE.md).

```markdown
Release Camunda Modeler `vVERSION`

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
* [ ] add new version to [updates-server](https://github.com/camunda/camunda-modeler-update-server) releases JSON file. Merge this file to master/live branches.
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```

You may create a blank issue and copy the template into it.
