# QuantME Modeling and Transformation Framework

[![Build Status](https://travis-ci.org/camunda/camunda-modeler.svg?branch=develop)](https://travis-ci.org/camunda/camunda-modeler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modeling solution for BPMN 2.0-based process models that need to integrate quantum applications.
It supports [Quantum4BPMN](https://github.com/UST-QuAntiL/QuantME-Quantum4BPMN), a BPMN extension to support the Quantum Modeling Extension (QuantME).

Therefore, it enables to create process models orchestrating classical and quantum applications and to transform these process models to standard-compliant BPMN, to retain their portability.

## Building the Application

```sh
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


## License

MIT

Based on the [Camunda Modeler](https://github.com/camunda/camunda-modeler) and uses [bpmn-js](https://github.com/bpmn-io/bpmn-js), [dmn-js](https://github.com/bpmn-io/dmn-js), and [cmmn-js](https://github.com/bpmn-io/cmmn-js), licensed under the [bpmn.io license](http://bpmn.io/license).
