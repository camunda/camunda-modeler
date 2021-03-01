# Camunda Modeler

[![Build Status](https://travis-ci.com/camunda/camunda-modeler.svg?branch=develop)](https://travis-ci.com/camunda/camunda-modeler)

An integrated modeling solution for BPMN, DMN and CMMN based on [bpmn.io](http://bpmn.io).

![Camunda Modeler](docs/screenshot.png)


## Resources

* [Changelog](./CHANGELOG.md)
* [Download](https://camunda.com/download/modeler/) (see also [nightly builds](https://downloads.camunda.cloud/release/camunda-modeler/nightly/))
* [Give Feedback](https://forum.camunda.org/c/modeler)
* [Report a Bug](https://github.com/camunda/camunda-modeler/issues)
* [User Documentation](https://docs.camunda.org/manual/latest/modeler/camunda-modeler/)


## Building the Application

Build the app in a Posix environment. On Windows that is Git Bash or WSL.

```sh
# checkout a tag
git checkout v1.1.0

# install dependencies
npm install

# execute all checks (lint, test and build)
npm run all

# build the application to ./dist
npm run build
```


### Development Setup

Spin up the application for development, all strings attached:

```
npm run dev
```


## Contributing

Please checkout our [contributing guidelines](./.github/CONTRIBUTING.md) if you plan to
file an issue or pull request.


## Code of Conduct

By participating to this project, please uphold to our [Code of Conduct](https://github.com/camunda/.github/blob/main/.github/CODE_OF_CONDUCT.md).


## License

MIT

Uses [bpmn-js](https://github.com/bpmn-io/bpmn-js), [dmn-js](https://github.com/bpmn-io/dmn-js), and [cmmn-js](https://github.com/bpmn-io/cmmn-js), licensed under the [bpmn.io license](http://bpmn.io/license).
