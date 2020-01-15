# Patch Release

__[Draft a patch release.](https://github.com/camunda/camunda-modeler/issues/new?title=Release%20Camunda%20Modeler%20vVERSION&body=Release+Camunda+Modeler+%60vVERSION%60%3A%0D%0A%0D%0A%2A+%5B+%5D+make+sure+dependencies+are+released+%28%60rm+-rf+node_modules+%26%26+npm+i+%26%26+npm+run+all%60+works%29%0D%0A++++%2A+%60bpmn-js%60%2C+%60dmn-js%60%2C+%60cmmn-js%60%2C+%60%2A-properties-panel%60%2C+%60%2A-moddle%60%2C+...%0D%0A%2A+%5B+%5D+close+all+issues+which+are+solved+by+dependency+updates%0D%0A%2A+%5B+%5D+smoke+test+to+verify+all+diagrams+can+be+created%0D%0A%2A+%5B+%5D+update+CHANGELOG%0D%0A%2A+%5B+%5D+semantic+release+%28%60npm+run+release%60%29%2C+cf.+%5Brelease+schema%5D%28https%3A%2F%2Fgithub.com%2Fbpmn-io%2Finternal-docs%2Ftree%2Fmaster%2Frelease-schema%29%0D%0A%2A+%5B+%5D+wait+for+%5BTravis%5D%28https%3A%2F%2Ftravis-ci.org%2Fcamunda%2Fcamunda-modeler%29+to+build+the+release%0D%0A%2A+%5B+%5D+prepare+a+list+of+what+was+changed+or+needs+to+be+tested%0D%0A%2A+%5B+%5D+execute+integration+test%2C+verifying+fixed+things+are+actually+fixed%0D%0A%2A+%5B+%5D+%5Boptional%5D+trigger+QA+for+fuzzy+testing%0D%0A%2A+%5B+%5D+publish+release+on+%5BGithub+Releases%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Freleases%29%0D%0A%2A+%5B+%5D+trigger+mirroring+of+release+to+https%3A%2F%2Fcamunda.org%2Frelease%2Fcamunda-modeler%2F+via+%5BJenkins%5D%28https%3A%2F%2Fci.cambpm.camunda.cloud%2Fjob%2Fsideprojects%2Fjob%2Fcamunda-modeler-desktop-RELEASE%2Fbuild%3Fdelay%3D0sec%29%0D%0A%2A+%5B+%5D+update+download+version+of+Camunda+Modeler+at+%5Bcamunda.com%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda.com-new%2Fblob%2Flive%2Fdata%2Freleases.json%29%0D%0A%2A+%5B+%5D+add+new+version+to+%5Bupdates-server%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler-update-server%29+releases+JSON+file.+Merge+this+file+to+master%2Flive+branches.%0D%0A%2A+%5B+%5D+close+%5Bcurrent+milestone%5D%28https%3A%2F%2Fgithub.com%2Fcamunda%2Fcamunda-modeler%2Fmilestones%29&labels=release)__

## Template

A list of things to perform to cut a Camunda Modeler patch release.

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
* [ ] add new version to [updates-server](https://github.com/camunda/camunda-modeler-update-server) releases JSON file. Merge this file to master/live branches.
* [ ] close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```

You may create a blank issue and copy the template into it.
