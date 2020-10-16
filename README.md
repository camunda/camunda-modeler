# QuantME Modeling and Transformation Framework

[![Build Status](https://travis-ci.com/UST-QuAntiL/QuantME-TransformationFramework.svg?branch=develop)](https://travis-ci.com/UST-QuAntiL/QuantME-TransformationFramework)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modeling solution for BPMN 2.0-based workflow models that need to integrate quantum applications.
It is based on [Quantum4BPMN](https://github.com/UST-QuAntiL/QuantME-Quantum4BPMN), a BPMN extension to support the Quantum Modeling Extension (QuantME).

Therefore, it enables to create workflow models orchestrating classical and quantum applications and to transform these workflow models to standard-compliant BPMN to retain their portability.

Please refer to the [documentation](./docs) for details of the possible usage of the framework to model and transform Quantum4BPMN workflow models.
For a quick start, please have a look at the [tutorial](./docs/quantme/Tutorial).

The following repository contains different use cases that were modeled and transformed by using the QuantME Modeling and Transformation Framework: [QuantME-UseCases](https://github.com/UST-QuAntiL/QuantME-UseCases).

### Building the Application

```sh
# install dependencies
npm install

# build the application to ./dist
npm run build
```

### Development Setup

First, build the plugins and then spin up the application for development:

```
npm run dev
```

## License

MIT

Based on the [Camunda Modeler](https://github.com/camunda/camunda-modeler) and uses [bpmn-js](https://github.com/bpmn-io/bpmn-js), [dmn-js](https://github.com/bpmn-io/dmn-js), and [cmmn-js](https://github.com/bpmn-io/cmmn-js), licensed under the [bpmn.io license](http://bpmn.io/license).

## Disclaimer of Warranty

Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE.
You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

## Haftungsausschluss

Dies ist ein Forschungsprototyp.
Die Haftung für entgangenen Gewinn, Produktionsausfall, Betriebsunterbrechung, entgangene Nutzungen, Verlust von Daten und Informationen, Finanzierungsaufwendungen sowie sonstige Vermögens- und Folgeschäden ist, außer in Fällen von grober Fahrlässigkeit, Vorsatz und Personenschäden, ausgeschlossen.
