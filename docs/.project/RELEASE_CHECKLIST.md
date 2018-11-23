# Release Checklist

A list of things to perform with every Camunda Modeler release.

__Hint:__ Create a release issue and copy the template below into it.


```markdown
* [ ] make sure dependencies are released (`rm -rf node_modules && npm i && npm run all` works)
    * `bpmn-js`, `dmn-js`, `cmmn-js`, `*-properties-panel`, `*-moddle`, ...
* [ ] smoke test to verify all diagrams can be created
* [ ] update CHANGELOG before releasing
* [ ] semantic release (`npm run release`)
* [ ] wait for CI infrastructure to build the release
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/master/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://camunda.org/release/camunda-modeler/)
    * [ ] Works on Linux
    * [ ] Works on Mac
    * [ ] Works on Windows
* [ ] Publish release on [Github Releases](https://github.com/camunda/camunda-modeler/releases)
* [ ] write blog post on [blog.camunda.org](https://github.com/camunda/blog.camunda.org)
* [ ] update download version of Camunda Modeler at [camunda.com](https://github.com/camunda/camunda.com-new/blob/live/data/releases.json)
* [ ] spread the word
    * [ ] `@alle` to trigger customer mail
    * [ ] tweet
* [ ] Close [current milestone](https://github.com/camunda/camunda-modeler/milestones)
```
