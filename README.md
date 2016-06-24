> Looking for the legacy [Camunda Eclipse plug-in](https://github.com/camunda/camunda-eclipse-plugin)?


# Camunda Modeler

[![Build Status](https://travis-ci.org/camunda/camunda-modeler.svg?branch=master)](https://travis-ci.org/camunda/camunda-modeler)

An integrated modeling solution for BPMN, DMN and CMMN based on [bpmn.io](http://bpmn.io).

![Camunda Modeler](https://raw.githubusercontent.com/camunda/camunda-modeler/master/docs/screenshot.png)


## Resources

* [Give Feedback](https://forum.camunda.org/c/modeler)
* [Download](http://camunda.org/release/camunda-modeler) (see also [nightly builds](http://camunda.org/release/camunda-modeler/nightly))
* [Report a Bug](https://github.com/camunda/camunda-modeler/issues)
* [User Documentation](https://docs.camunda.org/manual/latest/modeler/camunda-modeler/)


## Building the Application

```
# checkout a tag
git checkout v1.1.0

# install
npm install

# run all tests
npm run all
```


### Build a Snapshot (the master branch)

Building the master branch may fail due to snapshot dependencies being missing.
If that is the case, link them into the modeler project using the [wiredeps](https://github.com/nikku/wiredeps) utility:

```
npm install wiredeps

node_modules/.bin/wiredeps
```

### Development Setup

Spin up the application for development, all strings attached:

```
npm run dev
```


## License

MIT

Contains parts ([bpmn-js](https://github.com/bpmn-io/bpmn-js), [dmn-js](https://github.com/bpmn-io/dmn-js), [cmmn-js](https://github.com/bpmn-io/cmmn-js)) released under the [bpmn.io license](http://bpmn.io/license).
