/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../node_modules/camunda-modeler-plugin-helpers/components/Fill.js":
/*!*************************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/components/Fill.js ***!
  \*************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _helper_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../helper.js */ \"../node_modules/camunda-modeler-plugin-helpers/helper.js\");\n/* harmony import */ var _helper_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_helper_js__WEBPACK_IMPORTED_MODULE_0__);\n\n\n/**\n * Fill component. Set `slot` to \"toolbar\" to include in the top toolbar.\n * Use `group` and `priority=0` to place for correct ordering. The higher\n * the priority, the earlier the Fill is displayed within the group.\n *\n * @type {import('react').ComponentType<{ slot: string, group?: string, priority?: Number }>}\n *\n * @example\n *\n * import Fill from 'camunda-modeler-plugin-helpers/components/Fill.js';\n *\n * function CustomFill(props) {\n *   return (\n *     <Fill group=\"4_export\" slot=\"toolbar\" priority={100}>\n *       <button type=\"button\" onClick={ props.openExportTool }>\n *         Open Export Tool\n *       </button>\n *     </Fill>\n *   );\n * }\n */\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_helper_js__WEBPACK_IMPORTED_MODULE_0__.returnOrThrow)(() => window.components?.Fill, '5.0'));\n\n//# sourceURL=webpack://test-client/../node_modules/camunda-modeler-plugin-helpers/components/Fill.js?");

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/components/Modal.js":
/*!**************************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/components/Modal.js ***!
  \**************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _helper_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../helper.js */ \"../node_modules/camunda-modeler-plugin-helpers/helper.js\");\n/* harmony import */ var _helper_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_helper_js__WEBPACK_IMPORTED_MODULE_0__);\n\n\n/**\n * Modal component.\n *\n * @type {import('react').ComponentType<{ onClose: Function }>}\n *\n * @example\n *\n * import Modal from 'camunda-modeler-plugin-helpers/components/Modal.js';\n *\n * function CustomModal(props) {\n *   return (\n *    <Modal onClose={ props.onClose }>\n *      <Modal.Title>\n *        Custom Modal\n *      </Modal.Title>\n *      <Modal.Body>\n *        Hello world!\n *      </Modal.Body>\n *      <Modal.Footer>\n *        <button type=\"button\" onClick={ props.onClose }>\n *          Close\n *        </button>\n *      </Modal.Footer>\n *    </Modal>\n *   );\n * }\n */\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_helper_js__WEBPACK_IMPORTED_MODULE_0__.returnOrThrow)(() => window.components?.Modal, '5.0'));\n\n//# sourceURL=webpack://test-client/../node_modules/camunda-modeler-plugin-helpers/components/Modal.js?");

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/helper.js":
/*!****************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/helper.js ***!
  \****************************************************************/
/***/ ((module) => {

eval("function returnOrThrow(getter, minimalModelerVersion) {\n  let result;\n  try {\n    result = getter();\n  } catch (error) {}\n\n  if (!result) {\n    throw new Error(`Not compatible with Camunda Modeler < ${minimalModelerVersion}`);\n  }\n\n  return result;\n}\n\nmodule.exports = {\n  returnOrThrow\n};\n\n\n//# sourceURL=webpack://test-client/../node_modules/camunda-modeler-plugin-helpers/helper.js?");

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/index.js":
/*!***************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/index.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   getModelerDirectory: () => (/* binding */ getModelerDirectory),\n/* harmony export */   getPluginsDirectory: () => (/* binding */ getPluginsDirectory),\n/* harmony export */   registerBpmnJSModdleExtension: () => (/* binding */ registerBpmnJSModdleExtension),\n/* harmony export */   registerBpmnJSPlugin: () => (/* binding */ registerBpmnJSPlugin),\n/* harmony export */   registerClientExtension: () => (/* binding */ registerClientExtension),\n/* harmony export */   registerClientPlugin: () => (/* binding */ registerClientPlugin),\n/* harmony export */   registerCloudBpmnJSModdleExtension: () => (/* binding */ registerCloudBpmnJSModdleExtension),\n/* harmony export */   registerCloudBpmnJSPlugin: () => (/* binding */ registerCloudBpmnJSPlugin),\n/* harmony export */   registerCloudDmnJSModdleExtension: () => (/* binding */ registerCloudDmnJSModdleExtension),\n/* harmony export */   registerCloudDmnJSPlugin: () => (/* binding */ registerCloudDmnJSPlugin),\n/* harmony export */   registerDmnJSModdleExtension: () => (/* binding */ registerDmnJSModdleExtension),\n/* harmony export */   registerDmnJSPlugin: () => (/* binding */ registerDmnJSPlugin),\n/* harmony export */   registerPlatformBpmnJSModdleExtension: () => (/* binding */ registerPlatformBpmnJSModdleExtension),\n/* harmony export */   registerPlatformBpmnJSPlugin: () => (/* binding */ registerPlatformBpmnJSPlugin),\n/* harmony export */   registerPlatformDmnJSModdleExtension: () => (/* binding */ registerPlatformDmnJSModdleExtension),\n/* harmony export */   registerPlatformDmnJSPlugin: () => (/* binding */ registerPlatformDmnJSPlugin)\n/* harmony export */ });\n/**\n * Validate and register a client plugin.\n *\n * @param {Object} plugin\n * @param {String} type\n */\nfunction registerClientPlugin(plugin, type) {\n  var plugins = window.plugins || [];\n  window.plugins = plugins;\n\n  if (!plugin) {\n    throw new Error('plugin not specified');\n  }\n\n  if (!type) {\n    throw new Error('type not specified');\n  }\n\n  plugins.push({\n    plugin: plugin,\n    type: type\n  });\n}\n\n/**\n * Validate and register a client plugin.\n *\n * @param {import('react').ComponentType} extension\n *\n * @example\n *\n * import MyExtensionComponent from './MyExtensionComponent';\n *\n * registerClientExtension(MyExtensionComponent);\n */\nfunction registerClientExtension(component) {\n  registerClientPlugin(component, 'client');\n}\n\n/**\n * Validate and register a bpmn-js plugin.\n *\n * @param {Object} module\n *\n * @example\n *\n * import {\n *   registerBpmnJSPlugin\n * } from 'camunda-modeler-plugin-helpers';\n *\n * const BpmnJSModule = {\n *   __init__: [ 'myService' ],\n *   myService: [ 'type', ... ]\n * };\n *\n * registerBpmnJSPlugin(BpmnJSModule);\n */\nfunction registerBpmnJSPlugin(module) {\n  registerClientPlugin(module, 'bpmn.modeler.additionalModules');\n}\n\n/**\n * Validate and register a platform specific bpmn-js plugin.\n *\n * @param {Object} module\n *\n * @example\n *\n * import {\n *   registerPlatformBpmnJSPlugin\n * } from 'camunda-modeler-plugin-helpers';\n *\n * const BpmnJSModule = {\n *   __init__: [ 'myService' ],\n *   myService: [ 'type', ... ]\n * };\n *\n * registerPlatformBpmnJSPlugin(BpmnJSModule);\n */\nfunction registerPlatformBpmnJSPlugin(module) {\n  registerClientPlugin(module, 'bpmn.platform.modeler.additionalModules');\n}\n\n/**\n * Validate and register a cloud specific bpmn-js plugin.\n *\n * @param {Object} module\n *\n * @example\n *\n * import {\n *   registerCloudBpmnJSPlugin\n * } from 'camunda-modeler-plugin-helpers';\n *\n * const BpmnJSModule = {\n *   __init__: [ 'myService' ],\n *   myService: [ 'type', ... ]\n * };\n *\n * registerCloudBpmnJSPlugin(BpmnJSModule);\n */\nfunction registerCloudBpmnJSPlugin(module) {\n  registerClientPlugin(module, 'bpmn.cloud.modeler.additionalModules');\n}\n\n/**\n * Validate and register a bpmn-moddle extension plugin.\n *\n * @param {Object} descriptor\n *\n * @example\n * import {\n *   registerBpmnJSModdleExtension\n * } from 'camunda-modeler-plugin-helpers';\n *\n * var moddleDescriptor = {\n *   name: 'my descriptor',\n *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',\n *   prefix: 'mydesc',\n *\n *   ...\n * };\n *\n * registerBpmnJSModdleExtension(moddleDescriptor);\n */\nfunction registerBpmnJSModdleExtension(descriptor) {\n  registerClientPlugin(descriptor, 'bpmn.modeler.moddleExtension');\n}\n\n/**\n * Validate and register a platform specific bpmn-moddle extension plugin.\n *\n * @param {Object} descriptor\n *\n * @example\n * import {\n *   registerPlatformBpmnJSModdleExtension\n * } from 'camunda-modeler-plugin-helpers';\n *\n * var moddleDescriptor = {\n *   name: 'my descriptor',\n *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',\n *   prefix: 'mydesc',\n *\n *   ...\n * };\n *\n * registerPlatformBpmnJSModdleExtension(moddleDescriptor);\n */\nfunction registerPlatformBpmnJSModdleExtension(descriptor) {\n  registerClientPlugin(descriptor, 'bpmn.platform.modeler.moddleExtension');\n}\n\n/**\n * Validate and register a cloud specific bpmn-moddle extension plugin.\n *\n * @param {Object} descriptor\n *\n * @example\n * import {\n *   registerCloudBpmnJSModdleExtension\n * } from 'camunda-modeler-plugin-helpers';\n *\n * var moddleDescriptor = {\n *   name: 'my descriptor',\n *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',\n *   prefix: 'mydesc',\n *\n *   ...\n * };\n *\n * registerCloudBpmnJSModdleExtension(moddleDescriptor);\n */\nfunction registerCloudBpmnJSModdleExtension(descriptor) {\n  registerClientPlugin(descriptor, 'bpmn.cloud.modeler.moddleExtension');\n}\n\n/**\n * Validate and register a dmn-moddle extension plugin.\n *\n * @param {Object} descriptor\n *\n * @example\n * import {\n *   registerDmnJSModdleExtension\n * } from 'camunda-modeler-plugin-helpers';\n *\n * var moddleDescriptor = {\n *   name: 'my descriptor',\n *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',\n *   prefix: 'mydesc',\n *\n *   ...\n * };\n *\n * registerDmnJSModdleExtension(moddleDescriptor);\n */\nfunction registerDmnJSModdleExtension(descriptor) {\n  registerClientPlugin(descriptor, 'dmn.modeler.moddleExtension');\n}\n\n/**\n * Validate and register a cloud specific dmn-moddle extension plugin.\n *\n * @param {Object} descriptor\n *\n * @example\n * import {\n *   registerCloudDmnJSModdleExtension\n * } from 'camunda-modeler-plugin-helpers';\n *\n * var moddleDescriptor = {\n *   name: 'my descriptor',\n *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',\n *   prefix: 'mydesc',\n *\n *   ...\n * };\n *\n * registerCloudDmnJSModdleExtension(moddleDescriptor);\n */\nfunction registerCloudDmnJSModdleExtension(descriptor) {\n  registerClientPlugin(descriptor, 'dmn.cloud.modeler.moddleExtension');\n}\n\n/**\n * Validate and register a platform specific dmn-moddle extension plugin.\n *\n * @param {Object} descriptor\n *\n * @example\n * import {\n *   registerPlatformDmnJSModdleExtension\n * } from 'camunda-modeler-plugin-helpers';\n *\n * var moddleDescriptor = {\n *   name: 'my descriptor',\n *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',\n *   prefix: 'mydesc',\n *\n *   ...\n * };\n *\n * registerPlatformDmnJSModdleExtension(moddleDescriptor);\n */\nfunction registerPlatformDmnJSModdleExtension(descriptor) {\n  registerClientPlugin(descriptor, 'dmn.platform.modeler.moddleExtension');\n}\n\n/**\n * Validate and register a dmn-js plugin.\n *\n * @param {Object} module\n *\n * @example\n *\n * import {\n *   registerDmnJSPlugin\n * } from 'camunda-modeler-plugin-helpers';\n *\n * const DmnJSModule = {\n *   __init__: [ 'myService' ],\n *   myService: [ 'type', ... ]\n * };\n *\n * registerDmnJSPlugin(DmnJSModule, [ 'drd', 'literalExpression' ]);\n * registerDmnJSPlugin(DmnJSModule, 'drd')\n */\nfunction registerDmnJSPlugin(module, components) {\n\n  if (!Array.isArray(components)) {\n    components = [ components ]\n  }\n\n  components.forEach(c => registerClientPlugin(module, `dmn.modeler.${c}.additionalModules`));\n}\n\n/**\n * Validate and register a cloud specific dmn-js plugin.\n *\n * @param {Object} module\n *\n * @example\n *\n * import {\n *   registerCloudDmnJSPlugin\n * } from 'camunda-modeler-plugin-helpers';\n *\n * const DmnJSModule = {\n *   __init__: [ 'myService' ],\n *   myService: [ 'type', ... ]\n * };\n *\n * registerCloudDmnJSPlugin(DmnJSModule, [ 'drd', 'literalExpression' ]);\n * registerCloudDmnJSPlugin(DmnJSModule, 'drd')\n */\nfunction registerCloudDmnJSPlugin(module, components) {\n\n  if (!Array.isArray(components)) {\n    components = [ components ]\n  }\n\n  components.forEach(c => registerClientPlugin(module, `dmn.cloud.modeler.${c}.additionalModules`));\n}\n\n/**\n * Validate and register a platform specific dmn-js plugin.\n *\n * @param {Object} module\n *\n * @example\n *\n * import {\n *   registerPlatformDmnJSPlugin\n * } from 'camunda-modeler-plugin-helpers';\n *\n * const DmnJSModule = {\n *   __init__: [ 'myService' ],\n *   myService: [ 'type', ... ]\n * };\n *\n * registerPlatformDmnJSPlugin(DmnJSModule, [ 'drd', 'literalExpression' ]);\n * registerPlatformDmnJSPlugin(DmnJSModule, 'drd')\n */\nfunction registerPlatformDmnJSPlugin(module, components) {\n\n  if (!Array.isArray(components)) {\n    components = [ components ]\n  }\n\n  components.forEach(c => registerClientPlugin(module, `dmn.platform.modeler.${c}.additionalModules`));\n}\n\n/**\n * Return the modeler directory, as a string.\n *\n * @deprecated Will be removed in future Camunda Modeler versions without replacement.\n *\n * @return {String}\n */\nfunction getModelerDirectory() {\n  return window.getModelerDirectory();\n}\n\n/**\n * Return the modeler plugin directory, as a string.\n *\n * @deprecated Will be removed in future Camunda Modeler versions without replacement.\n *\n * @return {String}\n */\nfunction getPluginsDirectory() {\n  return window.getPluginsDirectory();\n}\n\n//# sourceURL=webpack://test-client/../node_modules/camunda-modeler-plugin-helpers/index.js?");

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/icons-react.js":
/*!************************************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/icons-react.js ***!
  \************************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const { returnOrThrow } = __webpack_require__(/*! ../../helper.js */ \"../node_modules/camunda-modeler-plugin-helpers/helper.js\");\n\n/**\n * Use this to access Carbon icons globally in UI extensions.\n *\n * @type {import('@carbon/icons-react')}\n */\nmodule.exports = returnOrThrow(() => window.vendor?.carbonIconsReact, '5.38');\n\n\n//# sourceURL=webpack://test-client/../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/icons-react.js?");

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/react.js":
/*!******************************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/react.js ***!
  \******************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const { returnOrThrow } = __webpack_require__(/*! ../../helper.js */ \"../node_modules/camunda-modeler-plugin-helpers/helper.js\");\n\n/**\n * Use this to access Carbon icons globally in UI extensions.\n *\n * @type {import('@carbon/react')}\n */\nmodule.exports = returnOrThrow(() => window.vendor?.carbonReact, '5.38');\n\n\n//# sourceURL=webpack://test-client/../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/react.js?");

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/vendor/react.js":
/*!**********************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/vendor/react.js ***!
  \**********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

eval("const { returnOrThrow } = __webpack_require__(/*! ../helper.js */ \"../node_modules/camunda-modeler-plugin-helpers/helper.js\");\n\n/**\n * React object used by Camunda Modeler. Use it to create UI extension.\n *\n * @type {import('react')}\n */\nmodule.exports = returnOrThrow(() => window.react, '3.4');\n\n\n//# sourceURL=webpack://test-client/../node_modules/camunda-modeler-plugin-helpers/vendor/react.js?");

/***/ }),

/***/ "./client/CarbonModal.js":
/*!*******************************!*\
  !*** ./client/CarbonModal.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ CarbonModal)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"../node_modules/camunda-modeler-plugin-helpers/vendor/react.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var camunda_modeler_plugin_helpers_components_Modal__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! camunda-modeler-plugin-helpers/components/Modal */ \"../node_modules/camunda-modeler-plugin-helpers/components/Modal.js\");\n/* harmony import */ var _carbon_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @carbon/react */ \"../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/react.js\");\n/* harmony import */ var _carbon_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_carbon_react__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _carbon_icons_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @carbon/icons-react */ \"../node_modules/camunda-modeler-plugin-helpers/vendor/@carbon/icons-react.js\");\n/* harmony import */ var _carbon_icons_react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_carbon_icons_react__WEBPACK_IMPORTED_MODULE_3__);\n/**\n * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH\n * under one or more contributor license agreements. See the NOTICE file\n * distributed with this work for additional information regarding copyright\n * ownership.\n *\n * Camunda licenses this file to you under the MIT; you may not use this file\n * except in compliance with the MIT License.\n */\n\n\n\n\n\nfunction CarbonModal({\n  onClose\n}) {\n  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Modal__WEBPACK_IMPORTED_MODULE_1__[\"default\"], null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Modal__WEBPACK_IMPORTED_MODULE_1__[\"default\"].Title, null, \"Test @react/carbon integration\"), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Modal__WEBPACK_IMPORTED_MODULE_1__[\"default\"].Body, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_carbon_react__WEBPACK_IMPORTED_MODULE_2__.Theme, {\n    theme: \"g90\"\n  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", {\n    className: \"bx--margin-bottom-05\",\n    style: {\n      margin: '10px',\n      padding: '10px'\n    }\n  }, \"If it has black background, it works.\")), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_carbon_react__WEBPACK_IMPORTED_MODULE_2__.TextInput, {\n    className: \"input-test-class\",\n    defaultwidth: 300,\n    helperText: \"Helper text\",\n    id: \"text-input-1\",\n    invalidText: \"Error message goes here\",\n    labelText: \"Label text\",\n    placeholder: \"Placeholder text\",\n    size: \"md\",\n    type: \"text\"\n  }), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_carbon_react__WEBPACK_IMPORTED_MODULE_2__.IconButton, {\n    label: \"Add\"\n  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_carbon_icons_react__WEBPACK_IMPORTED_MODULE_3__.Add, null))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Modal__WEBPACK_IMPORTED_MODULE_1__[\"default\"].Footer, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_carbon_react__WEBPACK_IMPORTED_MODULE_2__.Button, {\n    onClick: onClose\n  }, \"OK\")));\n}\n\n//# sourceURL=webpack://test-client/./client/CarbonModal.js?");

/***/ }),

/***/ "./client/TestClient.js":
/*!******************************!*\
  !*** ./client/TestClient.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ TestClient)\n/* harmony export */ });\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ \"../node_modules/camunda-modeler-plugin-helpers/vendor/react.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var camunda_modeler_plugin_helpers_components_Fill__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! camunda-modeler-plugin-helpers/components/Fill */ \"../node_modules/camunda-modeler-plugin-helpers/components/Fill.js\");\n/* harmony import */ var _CarbonModal__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./CarbonModal */ \"./client/CarbonModal.js\");\n/**\n * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH\n * under one or more contributor license agreements. See the NOTICE file\n * distributed with this work for additional information regarding copyright\n * ownership.\n *\n * Camunda licenses this file to you under the MIT; you may not use this file\n * except in compliance with the MIT License.\n */\n\n\n\n\nconst PLUGIN_NAME = 'test-client';\nclass TestClient extends react__WEBPACK_IMPORTED_MODULE_0__.Component {\n  constructor(props) {\n    super(props);\n    const {\n      subscribe,\n      settings\n    } = props;\n    subscribe('tab.saved', event => {\n      const {\n        tab\n      } = event;\n      const {\n        saveCounter\n      } = this.state;\n      console.log('[TestClient]', 'Tab saved', tab);\n      this.setState({\n        saveCounter: saveCounter + 1\n      });\n    });\n    subscribe('app.activeTabChanged', ({\n      activeTab\n    }) => {\n      this.setState({\n        tabType: activeTab.type\n      });\n    });\n    const pluginSettings = {\n      id: 'testClientPlugin',\n      title: 'Test Client Plugin',\n      properties: {\n        'testClientPlugin.heartbeat': {\n          type: 'boolean',\n          default: true,\n          label: 'Will My Heart Go On?',\n          description: 'Enable the heart icon in the status bar.'\n        },\n        'testClientPlugin.iconColor': {\n          type: 'text',\n          default: '#10ad73',\n          label: 'Icon color',\n          description: 'Color of the lovely heart icon.'\n        }\n      }\n    };\n    settings.register(pluginSettings);\n    settings.subscribe('testClientPlugin.iconColor', ({\n      value\n    }) => {\n      this.setState({\n        color: value\n      });\n    });\n    settings.subscribe('testClientPlugin.heartbeat', ({\n      value\n    }) => {\n      this.setState({\n        heartbeat: value\n      });\n    });\n    this.state = {\n      saveCounter: 0,\n      tabType: null,\n      showModal: false,\n      color: settings.get('testClientPlugin.iconColor'),\n      heartbeat: settings.get('testClientPlugin.heartbeat')\n    };\n  }\n  async componentDidMount() {\n    const {\n      config\n    } = this.props;\n    const saveCounter = await config.getForPlugin(PLUGIN_NAME, 'saveCounter', 0);\n    console.log('[TestClient]', 'last session save counter:', saveCounter);\n\n    // cleanup for next session\n    await config.setForPlugin(PLUGIN_NAME, 'saveCounter', 0);\n  }\n  async componentDidUpdate() {\n    const {\n      config\n    } = this.props;\n    await config.setForPlugin(PLUGIN_NAME, 'saveCounter', this.state.saveCounter);\n  }\n  render() {\n    const {\n      saveCounter,\n      tabType,\n      color,\n      heartbeat,\n      showModal\n    } = this.state;\n\n    /**\n     * Starting with Camunda Modeler v4.12 the `toolbar`\n     * slot is a no-op.\n     *\n     * Move your features to the `status-bar__file` and\n     * `status-bar__app` slots instead.\n     */\n\n    return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Fill__WEBPACK_IMPORTED_MODULE_1__[\"default\"], {\n      slot: \"toolbar\"\n    }, \"Saved: \", saveCounter), heartbeat && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Fill__WEBPACK_IMPORTED_MODULE_1__[\"default\"], {\n      slot: \"status-bar__file\"\n    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"button\", {\n      type: \"button\",\n      onClick: () => this.setState({\n        showModal: true\n      }),\n      className: \"btn\",\n      title: \"Just an icon (test-client plug-in contributed)\",\n      style: {\n        color: '#10ad73'\n      }\n    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(TestIcon, {\n      color: color\n    }))), /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Fill__WEBPACK_IMPORTED_MODULE_1__[\"default\"], {\n      slot: \"status-bar__app\",\n      group: \"0_first\"\n    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"div\", {\n      className: \"btn\",\n      style: {\n        background: '#10ad73',\n        color: '#FEFEFE'\n      }\n    }, \"Saved: \", saveCounter)), tabType === 'cloud-bpmn' && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components_Fill__WEBPACK_IMPORTED_MODULE_1__[\"default\"], {\n      slot: \"bottom-panel\",\n      label: \"Cloud Plugin\",\n      id: \"cloudPlugin\"\n    }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"h1\", null, \"Hello World\")), showModal && /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_CarbonModal__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n      onClose: () => this.setState({\n        showModal: false\n      })\n    }));\n  }\n}\nfunction TestIcon({\n  color\n}) {\n  return /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"svg\", {\n    xmlns: \"http://www.w3.org/2000/svg\",\n    viewBox: \"0 0 16 16\",\n    width: \"16\",\n    height: \"16\"\n  }, /*#__PURE__*/react__WEBPACK_IMPORTED_MODULE_0___default().createElement(\"path\", {\n    fill: color,\n    fillRule: \"evenodd\",\n    d: \"M7.655 14.916L8 14.25l.345.666a.752.752 0 01-.69 0zm0 0L8 14.25l.345.666.002-.001.006-.003.018-.01a7.643 7.643 0 00.31-.17 22.08 22.08 0 003.433-2.414C13.956 10.731 16 8.35 16 5.5 16 2.836 13.914 1 11.75 1 10.203 1 8.847 1.802 8 3.02 7.153 1.802 5.797 1 4.25 1 2.086 1 0 2.836 0 5.5c0 2.85 2.045 5.231 3.885 6.818a22.075 22.075 0 003.744 2.584l.018.01.006.003h.002z\"\n  }));\n}\n\n//# sourceURL=webpack://test-client/./client/TestClient.js?");

/***/ }),

/***/ "./client/index.js":
/*!*************************!*\
  !*** ./client/index.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! camunda-modeler-plugin-helpers */ \"../node_modules/camunda-modeler-plugin-helpers/index.js\");\n/* harmony import */ var _TestClient__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./TestClient */ \"./client/TestClient.js\");\n/**\n * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH\n * under one or more contributor license agreements. See the NOTICE file\n * distributed with this work for additional information regarding copyright\n * ownership.\n *\n * Camunda licenses this file to you under the MIT; you may not use this file\n * except in compliance with the MIT License.\n */\n\n\n\n(0,camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__.registerClientExtension)(_TestClient__WEBPACK_IMPORTED_MODULE_1__[\"default\"]);\n\n//# sourceURL=webpack://test-client/./client/index.js?");

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
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./client/index.js");
/******/ 	
/******/ })()
;