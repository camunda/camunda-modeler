# Release Checklist

A list of things to perform with every Camunda Modeler release.

__Hint:__ Create a release issue and copy the template below into it.


```markdown
* [ ] make sure dependencies are released (`rm -rf node_modules && npm i && npm run all` works)
    * `bpmn-js`, `dmn-js`, `cmmn-js`, `*-properties-panel`, `*-moddle`, ...
* [ ] smoke test to verify all diagrams can be created
* [ ] semantic release (`grunt release {minor|major|patch}`)
* [ ] wait for CI infrastructure to build the release
* [ ] execute [integration test](https://github.com/camunda/camunda-modeler/blob/master/docs/.project/INTEGRATION_TEST.md) on [released artifacts](https://camunda.org/release/camunda-modeler/)
    * [ ] Works on my machine
    * [ ] Works on Mac
    * [ ] Works on Windows
* [ ] write blog post on [blog.camunda.org](https://blog.camunda.org/)
* [ ] update download version on [camunda.org](https://github.com/camunda/camunda.org-new/blob/master/inc/config.php)
* [ ] spread the word
    * [ ] `@alle` to trigger customer mail
    * [ ] tweet
```
