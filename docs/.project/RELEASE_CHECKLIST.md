# Release Checklist

A list of things to perform with every Camunda Modeler release.

__Hint:__ Create a release issue and copy the template below into it.


```markdown
* [ ] make sure dependencies are released (`rm -rf node_modules && npm i && grunt` works)
* [ ] integration test running app via [`INTEGRATION_TEST.md`](https://github.com/camunda/camunda-modeler/blob/next/docs/INTEGRATION_TEST.md)
* [ ] semantic release (`grunt release {minor|major|patch}`)
* [ ] wait for CI infrastructure to build the release
* [ ] integration test [released artifacts](https://camunda.org/release/camunda-modeler/) once built
* [ ] write blog post on [blog.camunda.org](https://blog.camunda.org/)
* [ ] update download version on camunda.org
* [ ] spread the word
```
