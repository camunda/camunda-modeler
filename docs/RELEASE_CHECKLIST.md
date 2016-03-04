# RELEASE CHECKLIST

```markdown
* [ ] make sure dependencies are released (`rm -rf node_modules && npm i && grunt` works)
* [ ] integration test running app via [`INTEGRATION_TEST.md`](https://github.com/camunda/camunda-modeler/blob/next/docs/INTEGRATION_TEST.md)
* [ ] semantic release (`grunt release {minor|major|patch}`)
* [ ] wait for CI infrastructure to build the release
* [ ] integration test [released artifacts](https://camunda.org/release/camunda-modeler/) once built
* [ ] write blog post
* [ ] spread the word
```
