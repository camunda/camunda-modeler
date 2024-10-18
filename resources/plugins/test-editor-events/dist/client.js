/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../node_modules/camunda-modeler-plugin-helpers/index.js":
/*!***************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/index.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getModelerDirectory": () => (/* binding */ getModelerDirectory),
/* harmony export */   "getPluginsDirectory": () => (/* binding */ getPluginsDirectory),
/* harmony export */   "registerBpmnJSModdleExtension": () => (/* binding */ registerBpmnJSModdleExtension),
/* harmony export */   "registerBpmnJSPlugin": () => (/* binding */ registerBpmnJSPlugin),
/* harmony export */   "registerClientExtension": () => (/* binding */ registerClientExtension),
/* harmony export */   "registerClientPlugin": () => (/* binding */ registerClientPlugin),
/* harmony export */   "registerCloudBpmnJSModdleExtension": () => (/* binding */ registerCloudBpmnJSModdleExtension),
/* harmony export */   "registerCloudBpmnJSPlugin": () => (/* binding */ registerCloudBpmnJSPlugin),
/* harmony export */   "registerCloudDmnJSModdleExtension": () => (/* binding */ registerCloudDmnJSModdleExtension),
/* harmony export */   "registerCloudDmnJSPlugin": () => (/* binding */ registerCloudDmnJSPlugin),
/* harmony export */   "registerDmnJSModdleExtension": () => (/* binding */ registerDmnJSModdleExtension),
/* harmony export */   "registerDmnJSPlugin": () => (/* binding */ registerDmnJSPlugin),
/* harmony export */   "registerPlatformBpmnJSModdleExtension": () => (/* binding */ registerPlatformBpmnJSModdleExtension),
/* harmony export */   "registerPlatformBpmnJSPlugin": () => (/* binding */ registerPlatformBpmnJSPlugin),
/* harmony export */   "registerPlatformDmnJSModdleExtension": () => (/* binding */ registerPlatformDmnJSModdleExtension),
/* harmony export */   "registerPlatformDmnJSPlugin": () => (/* binding */ registerPlatformDmnJSPlugin)
/* harmony export */ });
/**
 * Validate and register a client plugin.
 *
 * @param {Object} plugin
 * @param {String} type
 */
function registerClientPlugin(plugin, type) {
  var plugins = window.plugins || [];
  window.plugins = plugins;

  if (!plugin) {
    throw new Error('plugin not specified');
  }

  if (!type) {
    throw new Error('type not specified');
  }

  plugins.push({
    plugin: plugin,
    type: type
  });
}

/**
 * Validate and register a client plugin.
 *
 * @param {import('react').ComponentType} extension
 *
 * @example
 *
 * import MyExtensionComponent from './MyExtensionComponent';
 *
 * registerClientExtension(MyExtensionComponent);
 */
function registerClientExtension(component) {
  registerClientPlugin(component, 'client');
}

/**
 * Validate and register a bpmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerBpmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const BpmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerBpmnJSPlugin(BpmnJSModule);
 */
function registerBpmnJSPlugin(module) {
  registerClientPlugin(module, 'bpmn.modeler.additionalModules');
}

/**
 * Validate and register a platform specific bpmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerPlatformBpmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const BpmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerPlatformBpmnJSPlugin(BpmnJSModule);
 */
function registerPlatformBpmnJSPlugin(module) {
  registerClientPlugin(module, 'bpmn.platform.modeler.additionalModules');
}

/**
 * Validate and register a cloud specific bpmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerCloudBpmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const BpmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerCloudBpmnJSPlugin(BpmnJSModule);
 */
function registerCloudBpmnJSPlugin(module) {
  registerClientPlugin(module, 'bpmn.cloud.modeler.additionalModules');
}

/**
 * Validate and register a bpmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerBpmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerBpmnJSModdleExtension(moddleDescriptor);
 */
function registerBpmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'bpmn.modeler.moddleExtension');
}

/**
 * Validate and register a platform specific bpmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerPlatformBpmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerPlatformBpmnJSModdleExtension(moddleDescriptor);
 */
function registerPlatformBpmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'bpmn.platform.modeler.moddleExtension');
}

/**
 * Validate and register a cloud specific bpmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerCloudBpmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerCloudBpmnJSModdleExtension(moddleDescriptor);
 */
function registerCloudBpmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'bpmn.cloud.modeler.moddleExtension');
}

/**
 * Validate and register a dmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerDmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerDmnJSModdleExtension(moddleDescriptor);
 */
function registerDmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'dmn.modeler.moddleExtension');
}

/**
 * Validate and register a cloud specific dmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerCloudDmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerCloudDmnJSModdleExtension(moddleDescriptor);
 */
function registerCloudDmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'dmn.cloud.modeler.moddleExtension');
}

/**
 * Validate and register a platform specific dmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerPlatformDmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerPlatformDmnJSModdleExtension(moddleDescriptor);
 */
function registerPlatformDmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'dmn.platform.modeler.moddleExtension');
}

/**
 * Validate and register a dmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerDmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const DmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerDmnJSPlugin(DmnJSModule, [ 'drd', 'literalExpression' ]);
 * registerDmnJSPlugin(DmnJSModule, 'drd')
 */
function registerDmnJSPlugin(module, components) {

  if (!Array.isArray(components)) {
    components = [ components ]
  }

  components.forEach(c => registerClientPlugin(module, `dmn.modeler.${c}.additionalModules`));
}

/**
 * Validate and register a cloud specific dmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerCloudDmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const DmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerCloudDmnJSPlugin(DmnJSModule, [ 'drd', 'literalExpression' ]);
 * registerCloudDmnJSPlugin(DmnJSModule, 'drd')
 */
function registerCloudDmnJSPlugin(module, components) {

  if (!Array.isArray(components)) {
    components = [ components ]
  }

  components.forEach(c => registerClientPlugin(module, `dmn.cloud.modeler.${c}.additionalModules`));
}

/**
 * Validate and register a platform specific dmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerPlatformDmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const DmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerPlatformDmnJSPlugin(DmnJSModule, [ 'drd', 'literalExpression' ]);
 * registerPlatformDmnJSPlugin(DmnJSModule, 'drd')
 */
function registerPlatformDmnJSPlugin(module, components) {

  if (!Array.isArray(components)) {
    components = [ components ]
  }

  components.forEach(c => registerClientPlugin(module, `dmn.platform.modeler.${c}.additionalModules`));
}

/**
 * Return the modeler directory, as a string.
 *
 * @deprecated Will be removed in future Camunda Modeler versions without replacement.
 *
 * @return {String}
 */
function getModelerDirectory() {
  return window.getModelerDirectory();
}

/**
 * Return the modeler plugin directory, as a string.
 *
 * @deprecated Will be removed in future Camunda Modeler versions without replacement.
 *
 * @return {String}
 */
function getPluginsDirectory() {
  return window.getPluginsDirectory();
}

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/react.js":
/*!***************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/react.js ***!
  \***************************************************************/
/***/ ((module) => {

if (!window.react) {
  throw new Error('Not compatible with Camunda Modeler < 3.4');
}

/**
 * React object used by Camunda Modeler. Use it to create UI extension.
 *
 * @type {import('react')}
 */
module.exports = window.react;

/***/ }),

/***/ "./client/TestEditorEvents.js":
/*!************************************!*\
  !*** ./client/TestEditorEvents.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ TestEditorEvents)
/* harmony export */ });
/* harmony import */ var camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! camunda-modeler-plugin-helpers/react */ "../node_modules/camunda-modeler-plugin-helpers/react.js");
/* harmony import */ var camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _bpmn_modeler_extension__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./bpmn-modeler-extension */ "./client/bpmn-modeler-extension/index.js");
/* harmony import */ var _dmn_modeler_extension__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dmn-modeler-extension */ "./client/dmn-modeler-extension/index.js");
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */







/**
 * An extension that shows how to hook into
 * editor events to accomplish the following:
 *
 * - hook into <bpmn.modeler.configure> to provide a bpmn.modeler extension
 * - hook into <bpmn.modeler.created> to register for bpmn.modeler events
 * - hook into <tab.saved> to perform a post-safe action
 *
 */
class TestEditorEvents extends camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0__.PureComponent {

  constructor(props) {

    super(props);

    const {
      subscribe
    } = props;

    subscribe('bpmn.modeler.configure', (event) => {

      const {
        tab,
        middlewares
      } = event;

      log('Creating editor for tab', tab);

      middlewares.push(addModule(_bpmn_modeler_extension__WEBPACK_IMPORTED_MODULE_1__["default"]));
    });


    subscribe('dmn.modeler.configure', (event) => {

      const {
        tab,
        middlewares
      } = event;

      log('Creating editor for tab', tab);

      middlewares.push(addDmnModule(_dmn_modeler_extension__WEBPACK_IMPORTED_MODULE_2__["default"]));
    });

    const onModelerCreated = event => {
      const {
        tab,
        modeler,
      } = event;

      log('Modeler created for tab', tab);

      modeler.on('saveXML.start', (event) => {

        const {
          definitions
        } = event;

        log('Saving XML with definitions', definitions, tab);
      });
    };

    subscribe('bpmn.modeler.created', onModelerCreated);
    subscribe('dmn.modeler.created', onModelerCreated);

    subscribe('tab.saved', (event) => {
      const {
        tab
      } = event;

      log('Tab saved', tab);
    });

  }

  render() {
    return null;
  }
}


// helpers //////////////

function log(...args) {
  console.log('[TestEditorEvents]', ...args);
}

/**
 * Returns a bpmn.modeler.configure middleware
 * that adds the specific module.
 *
 * @param {didi.Module} extensionModule
 *
 * @return {Function}
 */
function addModule(extensionModule) {

  return (config) => {

    const additionalModules = config.additionalModules || [];

    return {
      ...config,
      additionalModules: [
        ...additionalModules,
        extensionModule
      ]
    };
  };
}

function addDmnModule(extensionModule) {

  return (config) => {
    const newConfig = { ...config };

    for (const viewer of [ 'drd', 'decisionTable', 'literalExpression', 'boxedExpression' ]) {
      newConfig[viewer] = newConfig[viewer] || {};

      const additionalModules = (newConfig[viewer] && newConfig[viewer].additionalModules) || [];

      newConfig[viewer].additionalModules = [
        ...additionalModules,
        extensionModule
      ];
    }

    return newConfig;
  };
}


/***/ }),

/***/ "./client/bpmn-modeler-extension/TestEditorEventsLogger.js":
/*!*****************************************************************!*\
  !*** ./client/bpmn-modeler-extension/TestEditorEventsLogger.js ***!
  \*****************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EditorEventsLogger)
/* harmony export */ });
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

function EditorEventsLogger(eventBus) {

  eventBus.on('shape.added', function(event) {
    console.log('[EditorEventsLogger]', 'shape got added', event);
  });

}

EditorEventsLogger.$inject = [ 'eventBus' ];


/***/ }),

/***/ "./client/bpmn-modeler-extension/index.js":
/*!************************************************!*\
  !*** ./client/bpmn-modeler-extension/index.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _TestEditorEventsLogger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./TestEditorEventsLogger */ "./client/bpmn-modeler-extension/TestEditorEventsLogger.js");
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  __init__: [ 'testEditorEventsLogger' ],
  testEditorEventsLogger: [ 'type', _TestEditorEventsLogger__WEBPACK_IMPORTED_MODULE_0__["default"] ]
});

/***/ }),

/***/ "./client/dmn-modeler-extension/DmnTestEditorEventsLogger.js":
/*!*******************************************************************!*\
  !*** ./client/dmn-modeler-extension/DmnTestEditorEventsLogger.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EditorEventsLogger)
/* harmony export */ });
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

function EditorEventsLogger(eventBus) {

  eventBus.on('shape.added', function(event) {
    console.log('[EditorEventsLogger]', 'shape got added', event);
  });

  eventBus.on('col.add', function(event) {
    console.log('[EditorEventsLogger]', 'col got added', event);
  });

  eventBus.on('row.add', function(event) {
    console.log('[EditorEventsLogger]', 'row got added', event);
  });

}

EditorEventsLogger.$inject = [ 'eventBus' ];


/***/ }),

/***/ "./client/dmn-modeler-extension/index.js":
/*!***********************************************!*\
  !*** ./client/dmn-modeler-extension/index.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _DmnTestEditorEventsLogger__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DmnTestEditorEventsLogger */ "./client/dmn-modeler-extension/DmnTestEditorEventsLogger.js");
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  __init__: [ 'testEditorEventsLogger' ],
  testEditorEventsLogger: [ 'type', _DmnTestEditorEventsLogger__WEBPACK_IMPORTED_MODULE_0__["default"] ]
});


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*************************!*\
  !*** ./client/index.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! camunda-modeler-plugin-helpers */ "../node_modules/camunda-modeler-plugin-helpers/index.js");
/* harmony import */ var _TestEditorEvents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./TestEditorEvents */ "./client/TestEditorEvents.js");
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */





(0,camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__.registerClientExtension)(_TestEditorEvents__WEBPACK_IMPORTED_MODULE_1__["default"]);

})();

/******/ })()
;
//# sourceMappingURL=client.js.map