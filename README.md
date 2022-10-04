# QuantME Modeling and Transformation Framework

![Test on Linux and Windows](https://github.com/UST-QuAntiL/QuantME-TransformationFramework/workflows/Test%20on%20Linux%20and%20Windows/badge.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modeling solution for BPMN 2.0-based workflow models that need to integrate quantum applications.
It is based on [Quantum4BPMN](https://github.com/UST-QuAntiL/QuantME-Quantum4BPMN), a BPMN extension to support the Quantum Modeling Extension (QuantME).

Therefore, it enables to create workflow models orchestrating classical and quantum applications and to transform these workflow models to standard-compliant BPMN to retain their portability.

Please refer to the [documentation](./docs) for details of the possible usage of the framework to model and transform Quantum4BPMN workflow models.
For a quick start, please have a look at the [tutorial](./docs/quantme/Tutorial).

The following repository contains different use cases that were modeled and transformed by using the QuantME Modeling and Transformation Framework: [QuantME-UseCases](https://github.com/UST-QuAntiL/QuantME-UseCases).

### Building the Application

Build the app in a Posix environment. On Windows that is Git Bash or WSL.

[npm v8](https://www.npmjs.com/package/npm) and [Node.js v14](https://nodejs.org/en/blog/release/v14.17.3/) are required to build the QuantME Modeling and Transformation Framework.

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

### Docker Setup

If only the backend functionality available over the [REST API](./docs/quantme/API) is needed and not the graphical modeler, the application can also be started using Docker:

```
docker run -p 8888:8888 planqk/quantme-backend
```

### Troubleshooting

If there are errors during the build process of the application ensure that the correct npm and Node.js versions are installed.

In case conflicting package issues persist, the ``--legacy-peer-deps`` can be used to resolve them.

## License

MIT

Based on the [Camunda Modeler](https://github.com/camunda/camunda-modeler) and uses [bpmn-js](https://github.com/bpmn-io/bpmn-js), [dmn-js](https://github.com/bpmn-io/dmn-js), and [cmmn-js](https://github.com/bpmn-io/cmmn-js), licensed under the [bpmn.io license](http://bpmn.io/license).

## Disclaimer of Warranty

Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE.
You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

## Haftungsausschluss

Dies ist ein Forschungsprototyp.
Die Haftung für entgangenen Gewinn, Produktionsausfall, Betriebsunterbrechung, entgangene Nutzungen, Verlust von Daten und Informationen, Finanzierungsaufwendungen sowie sonstige Vermögens- und Folgeschäden ist, außer in Fällen von grober Fahrlässigkeit, Vorsatz und Personenschäden, ausgeschlossen.
