/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../node_modules/camunda-modeler-plugin-helpers/@carbon/icons-react.js":
/*!*****************************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/@carbon/icons-react.js ***!
  \*****************************************************************************/
/***/ ((module) => {

if (!window.carbonicons) {
  throw new Error('Not compatible: @carbon/icons-react is not available in this environment.');
}
  
/**
 * Use this to access Carbon icons globally in UI extensions.
 *
 * @type {import('@carbon/icons-react')}
 */
module.exports = window.carbonicons;

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/@carbon/react.js":
/*!***********************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/@carbon/react.js ***!
  \***********************************************************************/
/***/ ((module) => {

if (!window.carbon) {
  throw new Error('Not compatible: @carbon/react is not available in this environment.');
}

/**
 * Carbon React components provided by the host application.
 * Use this to access Carbon components globally in UI extensions.
 *
 * @type {import('@carbon/react')}
 */
module.exports = window.carbon;


/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/components.js":
/*!********************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/components.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CachedComponent: () => (/* binding */ CachedComponent),
/* harmony export */   Fill: () => (/* binding */ Fill),
/* harmony export */   Modal: () => (/* binding */ Modal),
/* harmony export */   NotCompatible: () => (/* binding */ NotCompatible),
/* harmony export */   Overlay: () => (/* binding */ Overlay),
/* harmony export */   Section: () => (/* binding */ Section),
/* harmony export */   TextInput: () => (/* binding */ TextInput),
/* harmony export */   ToggleSwitch: () => (/* binding */ ToggleSwitch),
/* harmony export */   WithCache: () => (/* binding */ WithCache),
/* harmony export */   WithCachedState: () => (/* binding */ WithCachedState),
/* harmony export */   createTab: () => (/* binding */ createTab)
/* harmony export */ });
if (!window.components) {
  throw notCompatible('3.4');
}

function notCompatible(requiredVersion) {
  return new Error('Not compatible with Camunda Modeler < v' + requiredVersion);
}

const NotCompatible = function(requiredVersion) {
  return function NotCompatibleComponent() {
    throw notCompatible(requiredVersion);
  };
};

/**
 * Fill component. Set `slot` to "toolbar" to include in the top toolbar.
 * Use `group` and `priority=0` to place for correct ordering. The higher
 * the priority, the earlier the Fill is displayed within the group.
 *
 * @type {import('react').ComponentType<{ slot: string, group?: string, priority?: Number }>}
 *
 * @example
 *
 * import { Fill } from 'camunda-modeler-plugin-helpers/components';
 *
 * function CustomFill(props) {
 *   return (
 *     <Fill group="4_export" slot="toolbar" priority={100}>
 *       <button type="button" onClick={ props.openExportTool }>
 *         Open Export Tool
 *       </button>
 *     </Fill>
 *   );
 * }
 */
const Fill = window.components.Fill;

/**
 * Modal component.
 *
 * @type {import('react').ComponentType<{ onClose: Function }>}
 *
 * @example
 *
 * import { Modal } from 'camunda-modeler-plugin-helpers/components';
 *
 * function CustomModal(props) {
 *   return (
 *    <Modal onClose={ props.onClose }>
 *      <Modal.Title>
 *        Custom Modal
 *      </Modal.Title>
 *      <Modal.Body>
 *        Hello world!
 *      </Modal.Body>
 *      <Modal.Footer>
 *        <button type="button" onClick={ props.onClose }>
 *          Close
 *        </button>
 *      </Modal.Footer>
 *    </Modal>
 *   );
 * }
 */
const Modal = window.components.Modal;

/**
 * Overlay component.
 *
 * @type {import('react').ComponentType<{ 
 *  onClose: Function, 
 *  anchor: Node, 
 *  offset?: { top?: number, bottom?: number, left?: number, right?: number }, 
 *  maxWidth?: number | string,
 *  maxHeight?: number | string,
 *  minWidth?: number | string,
 *  minHeight?: number | string
 * }>}
 *
 * @example
 * 
 * import { Overlay } from 'camunda-modeler-plugin-helpers/components';
 *
 * function CustomOverlay(props) {
 *   return (
 *    <Overlay onClose={ props.onClose } anchor={ props.btn_ref } offset={ props.anchor }>
 *      <Overlay.Title>
 *        Custom Modal
 *      </Overlay.Title>
 *      <Overlay.Body>
 *        Hello world!
 *      </Overlay.Body>
 *      <Overlay.Footer>
 *        <button type="button" onClick={ props.onClose }>
 *          Close
 *        </button>
 *      </Overlay.Footer>
 *    </Overlay>
 *   );
 * }
 */
 const Overlay = window.components.Overlay || NotCompatible('5.0');

 /**
 * Section component.
 *
 * @type {import('react').ComponentType<{ maxHeight: Number | String, relativePos: Boolean } }>}
 *
 * @example
 * 
 * import { Section } from 'camunda-modeler-plugin-helpers/components';
 *
 * function CustomSection(props) {
 *   return (
 *    <Section maxHeight="240px">
 *     <Section.Header>
 *       Custom section
 *     </Section.Header>
 *     <Section.Body>
 *       Hello world!
 *     </Section.Body>
 *     <Section.Actions>
 *      <button type="button" onClick={ props.onClose }>
 *        Close
 *      </button>
 *     </Section.Actions>
 *    </Section>
 *   );
 * }
 */
const Section = window.components.Section || NotCompatible('5.0');

 /**
 * ToggleSwitch component.
 *
 * @type {import('react').ComponentType<{ id: string, name: string, label?: string, switcherLabel?: string, description?: string }>}
 *
 * @example
 * 
 * import { ToggleSwitch } from 'camunda-modeler-plugin-helpers/components';
 *
 * function CustomToggle(props) {
 *   return (
 *    <Formik initialValues={ initialValues } onSubmit={ this.onSubmit }>
 *      {() => (
 *        <Form>
 *          <Field
 *            component={ ToggleSwitch }
 *            switcherLabel="Switcher label"
 *            id={ id }
 *            name={ name }
 *            description="Toggle description"
 *          />
 *        </Form>
 *       )}
 *    </Formik>
 *   );
 * }
 */
const ToggleSwitch = window.components.ToggleSwitch || NotCompatible('5.0');

 /**
 * TextInput component.
 *
 * @type {import('react').ComponentType<{ hint: string, name: string, label: string, fieldError: string, multiline: boolean, description: string }>}
 *
 * @example
 * 
 * import { TextInput } from 'camunda-modeler-plugin-helpers/components';
 *
 * function CustomInput(props) {
 *   return (
 *    <Formik initialValues={ initialValues } onSubmit={ this.onSubmit }>
 *      {() => (
 *        <Form>
 *          <Field
 *            component={ TextInput }
 *            label="My input"
 *            id={ id }
 *            multiline={ false }
 *            name={ name }
 *            description="Custom description"
 *          />
 *        </Form>
 *       )}
 *    </Formik>
 *   );
 * }
 */
const TextInput = window.components.TextInput || NotCompatible('5.29');

 /**
 * CachedComponent class.
 *
 * @type {import('react').ComponentClass}
 *
 * @example
 * 
 * import { CachedComponent } from 'camunda-modeler-plugin-helpers/components';
 * 
 * class ComponentWithCachedState extends CachedComponent {
 *  constructor(props) {
 *   super(props);
 *  }
 * 
 *  getCachedState() {
 *    return this.getCached()
 *  }
 * 
 *  setCachedState(values) {
 *    this.setCached(values)
 *  }
 * }
 * 
 */
const CachedComponent = window.components.CachedComponent || NotCompatible('5.29');

/**
 * A higher order component that passes cache to a wrapped component.
 * Forwards refs, too.
 * 
 * @type {Function}
 * @param {Component} Comp
 */
const WithCache = window.components.WithCache || NotCompatible('5.29');

/**
 * A higher order component that lazily
 * initiates the given wrapped component
 * via the `Comp#createCachedState` method.
 *
 * Passes props as well as destructured
 * wrapped component state to `Comp`.
 *
 * The resulting component must be called
 * with the `id` and `cache` prop.
 *
 * Forwards refs, too.
 *
 * @type {Function}
 * @param {Component} Comp
 */
const WithCachedState = window.components.WithCachedState || NotCompatible('5.29');

/**
 * A helper function to create Tab components
 * to be used with the TabProvider.
 *
 * @type {Function}
 * @param {string} tabName - The name of the tab.
 * @param {object} providers - The providers object.
 * @param {string} providers.type - The type of the provider.
 * @param {React.Component} providers.editor - The editor component.
 * @param {string} providers.defaultName - The default name of the provider.
 * @returns {React.Component} The created EditorTab component.
 */
const createTab = window.components.createTab || NotCompatible('5.29');

/***/ }),

/***/ "../node_modules/camunda-modeler-plugin-helpers/index.js":
/*!***************************************************************!*\
  !*** ../node_modules/camunda-modeler-plugin-helpers/index.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getModelerDirectory: () => (/* binding */ getModelerDirectory),
/* harmony export */   getPluginsDirectory: () => (/* binding */ getPluginsDirectory),
/* harmony export */   registerBpmnJSModdleExtension: () => (/* binding */ registerBpmnJSModdleExtension),
/* harmony export */   registerBpmnJSPlugin: () => (/* binding */ registerBpmnJSPlugin),
/* harmony export */   registerClientExtension: () => (/* binding */ registerClientExtension),
/* harmony export */   registerClientPlugin: () => (/* binding */ registerClientPlugin),
/* harmony export */   registerCloudBpmnJSModdleExtension: () => (/* binding */ registerCloudBpmnJSModdleExtension),
/* harmony export */   registerCloudBpmnJSPlugin: () => (/* binding */ registerCloudBpmnJSPlugin),
/* harmony export */   registerCloudDmnJSModdleExtension: () => (/* binding */ registerCloudDmnJSModdleExtension),
/* harmony export */   registerCloudDmnJSPlugin: () => (/* binding */ registerCloudDmnJSPlugin),
/* harmony export */   registerDmnJSModdleExtension: () => (/* binding */ registerDmnJSModdleExtension),
/* harmony export */   registerDmnJSPlugin: () => (/* binding */ registerDmnJSPlugin),
/* harmony export */   registerPlatformBpmnJSModdleExtension: () => (/* binding */ registerPlatformBpmnJSModdleExtension),
/* harmony export */   registerPlatformBpmnJSPlugin: () => (/* binding */ registerPlatformBpmnJSPlugin),
/* harmony export */   registerPlatformDmnJSModdleExtension: () => (/* binding */ registerPlatformDmnJSModdleExtension),
/* harmony export */   registerPlatformDmnJSPlugin: () => (/* binding */ registerPlatformDmnJSPlugin)
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

/***/ "./client/TestCarbon.js":
/*!******************************!*\
  !*** ./client/TestCarbon.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   TestCarbon: () => (/* binding */ TestCarbon)
/* harmony export */ });
/* harmony import */ var camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! camunda-modeler-plugin-helpers/react */ "../node_modules/camunda-modeler-plugin-helpers/react.js");
/* harmony import */ var camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var camunda_modeler_plugin_helpers_components__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! camunda-modeler-plugin-helpers/components */ "../node_modules/camunda-modeler-plugin-helpers/components.js");
/* harmony import */ var camunda_modeler_plugin_helpers_carbon_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! camunda-modeler-plugin-helpers/@carbon/react */ "../node_modules/camunda-modeler-plugin-helpers/@carbon/react.js");
/* harmony import */ var camunda_modeler_plugin_helpers_carbon_react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(camunda_modeler_plugin_helpers_carbon_react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var camunda_modeler_plugin_helpers_carbon_icons_react__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! camunda-modeler-plugin-helpers/@carbon/icons-react */ "../node_modules/camunda-modeler-plugin-helpers/@carbon/icons-react.js");
/* harmony import */ var camunda_modeler_plugin_helpers_carbon_icons_react__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(camunda_modeler_plugin_helpers_carbon_icons_react__WEBPACK_IMPORTED_MODULE_3__);
/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */






// import './TestCarbon.scss';

function TestCarbon() {
  const [modalOpen, setModalOpen] = camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().useState(false);
  (0,camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(() => {
    console.log('[TestCarbon] mounted');
  }, []);
  const close = () => {
    setModalOpen(false);
  };
  return /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement((camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null, modalOpen && /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(CarbonModal, {
    onClose: close
  }), /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components__WEBPACK_IMPORTED_MODULE_1__.Fill, {
    slot: "status-bar__app",
    group: "1_first"
  }, /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", {
    className: "btn",
    type: "button",
    onClick: () => setModalOpen(true)
  }, "Carbon")));
}
function CarbonModal({
  onClose
}) {
  return /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components__WEBPACK_IMPORTED_MODULE_1__.Modal, {
    className: "modal-test-carbon"
  }, /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components__WEBPACK_IMPORTED_MODULE_1__.Modal.Title, null, "Test Carbon"), /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components__WEBPACK_IMPORTED_MODULE_1__.Modal.Body, null, /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement("h1", null, "Carbon"), /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_carbon_react__WEBPACK_IMPORTED_MODULE_2__.Theme, {
    theme: "g90"
  }, /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "carbon-padding"
  }, "Carbon is cool")), /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement("p", {
    className: "carbon-color"
  }, "Carbon is colorful"), /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", null, /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_carbon_react__WEBPACK_IMPORTED_MODULE_2__.TextInput, {
    className: "input-test-class",
    defaultWidth: 300,
    helperText: "Helper text",
    id: "text-input-1",
    invalidText: "Error message goes here",
    labelText: "Label text",
    placeholder: "Placeholder text",
    size: "md",
    type: "text"
  }), /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_carbon_react__WEBPACK_IMPORTED_MODULE_2__.IconButton, {
    label: "Add"
  }, /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_carbon_icons_react__WEBPACK_IMPORTED_MODULE_3__.Add, null)))), /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_components__WEBPACK_IMPORTED_MODULE_1__.Modal.Footer, null, /*#__PURE__*/camunda_modeler_plugin_helpers_react__WEBPACK_IMPORTED_MODULE_0___default().createElement(camunda_modeler_plugin_helpers_carbon_react__WEBPACK_IMPORTED_MODULE_2__.Button, {
    onClick: onClose
  }, "OK")));
}

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
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!*************************!*\
  !*** ./client/index.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! camunda-modeler-plugin-helpers */ "../node_modules/camunda-modeler-plugin-helpers/index.js");
/* harmony import */ var _TestCarbon__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./TestCarbon */ "./client/TestCarbon.js");


(0,camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__.registerClientExtension)(_TestCarbon__WEBPACK_IMPORTED_MODULE_1__.TestCarbon);
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPO0FBQ1A7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTzs7QUFFUDtBQUNBO0FBQ0E7O0FBRUEsc0VBQXNFLEVBQUU7QUFDeEU7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FB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SSxDQUNULENBQ0ssQ0FBQyxlQUNiUix5RkFBQSxDQUFDRyw0RUFBSyxDQUFDaUMsTUFBTSxxQkFDWHBDLHlGQUFBLENBQUNJLCtFQUFNO0lBQUNvQixPQUFPLEVBQUdMO0VBQVMsR0FBQyxJQUFVLENBQzFCLENBQ1QsQ0FBQztBQUVaOzs7Ozs7VUM5RUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7V0N0QkE7V0FDQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLGlDQUFpQyxXQUFXO1dBQzVDO1dBQ0E7Ozs7O1dDUEE7V0FDQTtXQUNBO1dBQ0E7V0FDQSx5Q0FBeUMsd0NBQXdDO1dBQ2pGO1dBQ0E7V0FDQTs7Ozs7V0NQQTs7Ozs7V0NBQTtXQUNBO1dBQ0E7V0FDQSx1REFBdUQsaUJBQWlCO1dBQ3hFO1dBQ0EsZ0RBQWdELGFBQWE7V0FDN0Q7Ozs7Ozs7Ozs7Ozs7O0FDTnlFO0FBRS9CO0FBRTFDa0IsdUZBQXVCLENBQUM1QixtREFBVSxDQUFDLEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly90ZXN0LWNhcmJvbi8uLi9ub2RlX21vZHVsZXMvY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzL0BjYXJib24vaWNvbnMtcmVhY3QuanMiLCJ3ZWJwYWNrOi8vdGVzdC1jYXJib24vLi4vbm9kZV9tb2R1bGVzL2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycy9AY2FyYm9uL3JlYWN0LmpzIiwid2VicGFjazovL3Rlc3QtY2FyYm9uLy4uL25vZGVfbW9kdWxlcy9jYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMvY29tcG9uZW50cy5qcyIsIndlYnBhY2s6Ly90ZXN0LWNhcmJvbi8uLi9ub2RlX21vZHVsZXMvY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzL2luZGV4LmpzIiwid2VicGFjazovL3Rlc3QtY2FyYm9uLy4uL25vZGVfbW9kdWxlcy9jYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMvcmVhY3QuanMiLCJ3ZWJwYWNrOi8vdGVzdC1jYXJib24vLi9jbGllbnQvVGVzdENhcmJvbi5qcyIsIndlYnBhY2s6Ly90ZXN0LWNhcmJvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly90ZXN0LWNhcmJvbi93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly90ZXN0LWNhcmJvbi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vdGVzdC1jYXJib24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly90ZXN0LWNhcmJvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL3Rlc3QtY2FyYm9uLy4vY2xpZW50L2luZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbImlmICghd2luZG93LmNhcmJvbmljb25zKSB7XG4gIHRocm93IG5ldyBFcnJvcignTm90IGNvbXBhdGlibGU6IEBjYXJib24vaWNvbnMtcmVhY3QgaXMgbm90IGF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50LicpO1xufVxuICBcbi8qKlxuICogVXNlIHRoaXMgdG8gYWNjZXNzIENhcmJvbiBpY29ucyBnbG9iYWxseSBpbiBVSSBleHRlbnNpb25zLlxuICpcbiAqIEB0eXBlIHtpbXBvcnQoJ0BjYXJib24vaWNvbnMtcmVhY3QnKX1cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB3aW5kb3cuY2FyYm9uaWNvbnM7IiwiaWYgKCF3aW5kb3cuY2FyYm9uKSB7XG4gIHRocm93IG5ldyBFcnJvcignTm90IGNvbXBhdGlibGU6IEBjYXJib24vcmVhY3QgaXMgbm90IGF2YWlsYWJsZSBpbiB0aGlzIGVudmlyb25tZW50LicpO1xufVxuXG4vKipcbiAqIENhcmJvbiBSZWFjdCBjb21wb25lbnRzIHByb3ZpZGVkIGJ5IHRoZSBob3N0IGFwcGxpY2F0aW9uLlxuICogVXNlIHRoaXMgdG8gYWNjZXNzIENhcmJvbiBjb21wb25lbnRzIGdsb2JhbGx5IGluIFVJIGV4dGVuc2lvbnMuXG4gKlxuICogQHR5cGUge2ltcG9ydCgnQGNhcmJvbi9yZWFjdCcpfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHdpbmRvdy5jYXJib247XG4iLCJpZiAoIXdpbmRvdy5jb21wb25lbnRzKSB7XG4gIHRocm93IG5vdENvbXBhdGlibGUoJzMuNCcpO1xufVxuXG5mdW5jdGlvbiBub3RDb21wYXRpYmxlKHJlcXVpcmVkVmVyc2lvbikge1xuICByZXR1cm4gbmV3IEVycm9yKCdOb3QgY29tcGF0aWJsZSB3aXRoIENhbXVuZGEgTW9kZWxlciA8IHYnICsgcmVxdWlyZWRWZXJzaW9uKTtcbn1cblxuZXhwb3J0IGNvbnN0IE5vdENvbXBhdGlibGUgPSBmdW5jdGlvbihyZXF1aXJlZFZlcnNpb24pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIE5vdENvbXBhdGlibGVDb21wb25lbnQoKSB7XG4gICAgdGhyb3cgbm90Q29tcGF0aWJsZShyZXF1aXJlZFZlcnNpb24pO1xuICB9O1xufTtcblxuLyoqXG4gKiBGaWxsIGNvbXBvbmVudC4gU2V0IGBzbG90YCB0byBcInRvb2xiYXJcIiB0byBpbmNsdWRlIGluIHRoZSB0b3AgdG9vbGJhci5cbiAqIFVzZSBgZ3JvdXBgIGFuZCBgcHJpb3JpdHk9MGAgdG8gcGxhY2UgZm9yIGNvcnJlY3Qgb3JkZXJpbmcuIFRoZSBoaWdoZXJcbiAqIHRoZSBwcmlvcml0eSwgdGhlIGVhcmxpZXIgdGhlIEZpbGwgaXMgZGlzcGxheWVkIHdpdGhpbiB0aGUgZ3JvdXAuXG4gKlxuICogQHR5cGUge2ltcG9ydCgncmVhY3QnKS5Db21wb25lbnRUeXBlPHsgc2xvdDogc3RyaW5nLCBncm91cD86IHN0cmluZywgcHJpb3JpdHk/OiBOdW1iZXIgfT59XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiBpbXBvcnQgeyBGaWxsIH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzL2NvbXBvbmVudHMnO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbUZpbGwocHJvcHMpIHtcbiAqICAgcmV0dXJuIChcbiAqICAgICA8RmlsbCBncm91cD1cIjRfZXhwb3J0XCIgc2xvdD1cInRvb2xiYXJcIiBwcmlvcml0eT17MTAwfT5cbiAqICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eyBwcm9wcy5vcGVuRXhwb3J0VG9vbCB9PlxuICogICAgICAgICBPcGVuIEV4cG9ydCBUb29sXG4gKiAgICAgICA8L2J1dHRvbj5cbiAqICAgICA8L0ZpbGw+XG4gKiAgICk7XG4gKiB9XG4gKi9cbmV4cG9ydCBjb25zdCBGaWxsID0gd2luZG93LmNvbXBvbmVudHMuRmlsbDtcblxuLyoqXG4gKiBNb2RhbCBjb21wb25lbnQuXG4gKlxuICogQHR5cGUge2ltcG9ydCgncmVhY3QnKS5Db21wb25lbnRUeXBlPHsgb25DbG9zZTogRnVuY3Rpb24gfT59XG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiBpbXBvcnQgeyBNb2RhbCB9IGZyb20gJ2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycy9jb21wb25lbnRzJztcbiAqXG4gKiBmdW5jdGlvbiBDdXN0b21Nb2RhbChwcm9wcykge1xuICogICByZXR1cm4gKFxuICogICAgPE1vZGFsIG9uQ2xvc2U9eyBwcm9wcy5vbkNsb3NlIH0+XG4gKiAgICAgIDxNb2RhbC5UaXRsZT5cbiAqICAgICAgICBDdXN0b20gTW9kYWxcbiAqICAgICAgPC9Nb2RhbC5UaXRsZT5cbiAqICAgICAgPE1vZGFsLkJvZHk+XG4gKiAgICAgICAgSGVsbG8gd29ybGQhXG4gKiAgICAgIDwvTW9kYWwuQm9keT5cbiAqICAgICAgPE1vZGFsLkZvb3Rlcj5cbiAqICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsgcHJvcHMub25DbG9zZSB9PlxuICogICAgICAgICAgQ2xvc2VcbiAqICAgICAgICA8L2J1dHRvbj5cbiAqICAgICAgPC9Nb2RhbC5Gb290ZXI+XG4gKiAgICA8L01vZGFsPlxuICogICApO1xuICogfVxuICovXG5leHBvcnQgY29uc3QgTW9kYWwgPSB3aW5kb3cuY29tcG9uZW50cy5Nb2RhbDtcblxuLyoqXG4gKiBPdmVybGF5IGNvbXBvbmVudC5cbiAqXG4gKiBAdHlwZSB7aW1wb3J0KCdyZWFjdCcpLkNvbXBvbmVudFR5cGU8eyBcbiAqICBvbkNsb3NlOiBGdW5jdGlvbiwgXG4gKiAgYW5jaG9yOiBOb2RlLCBcbiAqICBvZmZzZXQ/OiB7IHRvcD86IG51bWJlciwgYm90dG9tPzogbnVtYmVyLCBsZWZ0PzogbnVtYmVyLCByaWdodD86IG51bWJlciB9LCBcbiAqICBtYXhXaWR0aD86IG51bWJlciB8IHN0cmluZyxcbiAqICBtYXhIZWlnaHQ/OiBudW1iZXIgfCBzdHJpbmcsXG4gKiAgbWluV2lkdGg/OiBudW1iZXIgfCBzdHJpbmcsXG4gKiAgbWluSGVpZ2h0PzogbnVtYmVyIHwgc3RyaW5nXG4gKiB9Pn1cbiAqXG4gKiBAZXhhbXBsZVxuICogXG4gKiBpbXBvcnQgeyBPdmVybGF5IH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzL2NvbXBvbmVudHMnO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbU92ZXJsYXkocHJvcHMpIHtcbiAqICAgcmV0dXJuIChcbiAqICAgIDxPdmVybGF5IG9uQ2xvc2U9eyBwcm9wcy5vbkNsb3NlIH0gYW5jaG9yPXsgcHJvcHMuYnRuX3JlZiB9IG9mZnNldD17IHByb3BzLmFuY2hvciB9PlxuICogICAgICA8T3ZlcmxheS5UaXRsZT5cbiAqICAgICAgICBDdXN0b20gTW9kYWxcbiAqICAgICAgPC9PdmVybGF5LlRpdGxlPlxuICogICAgICA8T3ZlcmxheS5Cb2R5PlxuICogICAgICAgIEhlbGxvIHdvcmxkIVxuICogICAgICA8L092ZXJsYXkuQm9keT5cbiAqICAgICAgPE92ZXJsYXkuRm9vdGVyPlxuICogICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIG9uQ2xpY2s9eyBwcm9wcy5vbkNsb3NlIH0+XG4gKiAgICAgICAgICBDbG9zZVxuICogICAgICAgIDwvYnV0dG9uPlxuICogICAgICA8L092ZXJsYXkuRm9vdGVyPlxuICogICAgPC9PdmVybGF5PlxuICogICApO1xuICogfVxuICovXG4gZXhwb3J0IGNvbnN0IE92ZXJsYXkgPSB3aW5kb3cuY29tcG9uZW50cy5PdmVybGF5IHx8IE5vdENvbXBhdGlibGUoJzUuMCcpO1xuXG4gLyoqXG4gKiBTZWN0aW9uIGNvbXBvbmVudC5cbiAqXG4gKiBAdHlwZSB7aW1wb3J0KCdyZWFjdCcpLkNvbXBvbmVudFR5cGU8eyBtYXhIZWlnaHQ6IE51bWJlciB8IFN0cmluZywgcmVsYXRpdmVQb3M6IEJvb2xlYW4gfSB9Pn1cbiAqXG4gKiBAZXhhbXBsZVxuICogXG4gKiBpbXBvcnQgeyBTZWN0aW9uIH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzL2NvbXBvbmVudHMnO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbVNlY3Rpb24ocHJvcHMpIHtcbiAqICAgcmV0dXJuIChcbiAqICAgIDxTZWN0aW9uIG1heEhlaWdodD1cIjI0MHB4XCI+XG4gKiAgICAgPFNlY3Rpb24uSGVhZGVyPlxuICogICAgICAgQ3VzdG9tIHNlY3Rpb25cbiAqICAgICA8L1NlY3Rpb24uSGVhZGVyPlxuICogICAgIDxTZWN0aW9uLkJvZHk+XG4gKiAgICAgICBIZWxsbyB3b3JsZCFcbiAqICAgICA8L1NlY3Rpb24uQm9keT5cbiAqICAgICA8U2VjdGlvbi5BY3Rpb25zPlxuICogICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBvbkNsaWNrPXsgcHJvcHMub25DbG9zZSB9PlxuICogICAgICAgIENsb3NlXG4gKiAgICAgIDwvYnV0dG9uPlxuICogICAgIDwvU2VjdGlvbi5BY3Rpb25zPlxuICogICAgPC9TZWN0aW9uPlxuICogICApO1xuICogfVxuICovXG5leHBvcnQgY29uc3QgU2VjdGlvbiA9IHdpbmRvdy5jb21wb25lbnRzLlNlY3Rpb24gfHwgTm90Q29tcGF0aWJsZSgnNS4wJyk7XG5cbiAvKipcbiAqIFRvZ2dsZVN3aXRjaCBjb21wb25lbnQuXG4gKlxuICogQHR5cGUge2ltcG9ydCgncmVhY3QnKS5Db21wb25lbnRUeXBlPHsgaWQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBsYWJlbD86IHN0cmluZywgc3dpdGNoZXJMYWJlbD86IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcgfT59XG4gKlxuICogQGV4YW1wbGVcbiAqIFxuICogaW1wb3J0IHsgVG9nZ2xlU3dpdGNoIH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzL2NvbXBvbmVudHMnO1xuICpcbiAqIGZ1bmN0aW9uIEN1c3RvbVRvZ2dsZShwcm9wcykge1xuICogICByZXR1cm4gKFxuICogICAgPEZvcm1payBpbml0aWFsVmFsdWVzPXsgaW5pdGlhbFZhbHVlcyB9IG9uU3VibWl0PXsgdGhpcy5vblN1Ym1pdCB9PlxuICogICAgICB7KCkgPT4gKFxuICogICAgICAgIDxGb3JtPlxuICogICAgICAgICAgPEZpZWxkXG4gKiAgICAgICAgICAgIGNvbXBvbmVudD17IFRvZ2dsZVN3aXRjaCB9XG4gKiAgICAgICAgICAgIHN3aXRjaGVyTGFiZWw9XCJTd2l0Y2hlciBsYWJlbFwiXG4gKiAgICAgICAgICAgIGlkPXsgaWQgfVxuICogICAgICAgICAgICBuYW1lPXsgbmFtZSB9XG4gKiAgICAgICAgICAgIGRlc2NyaXB0aW9uPVwiVG9nZ2xlIGRlc2NyaXB0aW9uXCJcbiAqICAgICAgICAgIC8+XG4gKiAgICAgICAgPC9Gb3JtPlxuICogICAgICAgKX1cbiAqICAgIDwvRm9ybWlrPlxuICogICApO1xuICogfVxuICovXG5leHBvcnQgY29uc3QgVG9nZ2xlU3dpdGNoID0gd2luZG93LmNvbXBvbmVudHMuVG9nZ2xlU3dpdGNoIHx8IE5vdENvbXBhdGlibGUoJzUuMCcpO1xuXG4gLyoqXG4gKiBUZXh0SW5wdXQgY29tcG9uZW50LlxuICpcbiAqIEB0eXBlIHtpbXBvcnQoJ3JlYWN0JykuQ29tcG9uZW50VHlwZTx7IGhpbnQ6IHN0cmluZywgbmFtZTogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCBmaWVsZEVycm9yOiBzdHJpbmcsIG11bHRpbGluZTogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB9Pn1cbiAqXG4gKiBAZXhhbXBsZVxuICogXG4gKiBpbXBvcnQgeyBUZXh0SW5wdXQgfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMvY29tcG9uZW50cyc7XG4gKlxuICogZnVuY3Rpb24gQ3VzdG9tSW5wdXQocHJvcHMpIHtcbiAqICAgcmV0dXJuIChcbiAqICAgIDxGb3JtaWsgaW5pdGlhbFZhbHVlcz17IGluaXRpYWxWYWx1ZXMgfSBvblN1Ym1pdD17IHRoaXMub25TdWJtaXQgfT5cbiAqICAgICAgeygpID0+IChcbiAqICAgICAgICA8Rm9ybT5cbiAqICAgICAgICAgIDxGaWVsZFxuICogICAgICAgICAgICBjb21wb25lbnQ9eyBUZXh0SW5wdXQgfVxuICogICAgICAgICAgICBsYWJlbD1cIk15IGlucHV0XCJcbiAqICAgICAgICAgICAgaWQ9eyBpZCB9XG4gKiAgICAgICAgICAgIG11bHRpbGluZT17IGZhbHNlIH1cbiAqICAgICAgICAgICAgbmFtZT17IG5hbWUgfVxuICogICAgICAgICAgICBkZXNjcmlwdGlvbj1cIkN1c3RvbSBkZXNjcmlwdGlvblwiXG4gKiAgICAgICAgICAvPlxuICogICAgICAgIDwvRm9ybT5cbiAqICAgICAgICl9XG4gKiAgICA8L0Zvcm1paz5cbiAqICAgKTtcbiAqIH1cbiAqL1xuZXhwb3J0IGNvbnN0IFRleHRJbnB1dCA9IHdpbmRvdy5jb21wb25lbnRzLlRleHRJbnB1dCB8fCBOb3RDb21wYXRpYmxlKCc1LjI5Jyk7XG5cbiAvKipcbiAqIENhY2hlZENvbXBvbmVudCBjbGFzcy5cbiAqXG4gKiBAdHlwZSB7aW1wb3J0KCdyZWFjdCcpLkNvbXBvbmVudENsYXNzfVxuICpcbiAqIEBleGFtcGxlXG4gKiBcbiAqIGltcG9ydCB7IENhY2hlZENvbXBvbmVudCB9IGZyb20gJ2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycy9jb21wb25lbnRzJztcbiAqIFxuICogY2xhc3MgQ29tcG9uZW50V2l0aENhY2hlZFN0YXRlIGV4dGVuZHMgQ2FjaGVkQ29tcG9uZW50IHtcbiAqICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICogICBzdXBlcihwcm9wcyk7XG4gKiAgfVxuICogXG4gKiAgZ2V0Q2FjaGVkU3RhdGUoKSB7XG4gKiAgICByZXR1cm4gdGhpcy5nZXRDYWNoZWQoKVxuICogIH1cbiAqIFxuICogIHNldENhY2hlZFN0YXRlKHZhbHVlcykge1xuICogICAgdGhpcy5zZXRDYWNoZWQodmFsdWVzKVxuICogIH1cbiAqIH1cbiAqIFxuICovXG5leHBvcnQgY29uc3QgQ2FjaGVkQ29tcG9uZW50ID0gd2luZG93LmNvbXBvbmVudHMuQ2FjaGVkQ29tcG9uZW50IHx8IE5vdENvbXBhdGlibGUoJzUuMjknKTtcblxuLyoqXG4gKiBBIGhpZ2hlciBvcmRlciBjb21wb25lbnQgdGhhdCBwYXNzZXMgY2FjaGUgdG8gYSB3cmFwcGVkIGNvbXBvbmVudC5cbiAqIEZvcndhcmRzIHJlZnMsIHRvby5cbiAqIFxuICogQHR5cGUge0Z1bmN0aW9ufVxuICogQHBhcmFtIHtDb21wb25lbnR9IENvbXBcbiAqL1xuZXhwb3J0IGNvbnN0IFdpdGhDYWNoZSA9IHdpbmRvdy5jb21wb25lbnRzLldpdGhDYWNoZSB8fCBOb3RDb21wYXRpYmxlKCc1LjI5Jyk7XG5cbi8qKlxuICogQSBoaWdoZXIgb3JkZXIgY29tcG9uZW50IHRoYXQgbGF6aWx5XG4gKiBpbml0aWF0ZXMgdGhlIGdpdmVuIHdyYXBwZWQgY29tcG9uZW50XG4gKiB2aWEgdGhlIGBDb21wI2NyZWF0ZUNhY2hlZFN0YXRlYCBtZXRob2QuXG4gKlxuICogUGFzc2VzIHByb3BzIGFzIHdlbGwgYXMgZGVzdHJ1Y3R1cmVkXG4gKiB3cmFwcGVkIGNvbXBvbmVudCBzdGF0ZSB0byBgQ29tcGAuXG4gKlxuICogVGhlIHJlc3VsdGluZyBjb21wb25lbnQgbXVzdCBiZSBjYWxsZWRcbiAqIHdpdGggdGhlIGBpZGAgYW5kIGBjYWNoZWAgcHJvcC5cbiAqXG4gKiBGb3J3YXJkcyByZWZzLCB0b28uXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICogQHBhcmFtIHtDb21wb25lbnR9IENvbXBcbiAqL1xuZXhwb3J0IGNvbnN0IFdpdGhDYWNoZWRTdGF0ZSA9IHdpbmRvdy5jb21wb25lbnRzLldpdGhDYWNoZWRTdGF0ZSB8fCBOb3RDb21wYXRpYmxlKCc1LjI5Jyk7XG5cbi8qKlxuICogQSBoZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIFRhYiBjb21wb25lbnRzXG4gKiB0byBiZSB1c2VkIHdpdGggdGhlIFRhYlByb3ZpZGVyLlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqIEBwYXJhbSB7c3RyaW5nfSB0YWJOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHRhYi5cbiAqIEBwYXJhbSB7b2JqZWN0fSBwcm92aWRlcnMgLSBUaGUgcHJvdmlkZXJzIG9iamVjdC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwcm92aWRlcnMudHlwZSAtIFRoZSB0eXBlIG9mIHRoZSBwcm92aWRlci5cbiAqIEBwYXJhbSB7UmVhY3QuQ29tcG9uZW50fSBwcm92aWRlcnMuZWRpdG9yIC0gVGhlIGVkaXRvciBjb21wb25lbnQuXG4gKiBAcGFyYW0ge3N0cmluZ30gcHJvdmlkZXJzLmRlZmF1bHROYW1lIC0gVGhlIGRlZmF1bHQgbmFtZSBvZiB0aGUgcHJvdmlkZXIuXG4gKiBAcmV0dXJucyB7UmVhY3QuQ29tcG9uZW50fSBUaGUgY3JlYXRlZCBFZGl0b3JUYWIgY29tcG9uZW50LlxuICovXG5leHBvcnQgY29uc3QgY3JlYXRlVGFiID0gd2luZG93LmNvbXBvbmVudHMuY3JlYXRlVGFiIHx8IE5vdENvbXBhdGlibGUoJzUuMjknKTsiLCIvKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGNsaWVudCBwbHVnaW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBsdWdpblxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ2xpZW50UGx1Z2luKHBsdWdpbiwgdHlwZSkge1xuICB2YXIgcGx1Z2lucyA9IHdpbmRvdy5wbHVnaW5zIHx8IFtdO1xuICB3aW5kb3cucGx1Z2lucyA9IHBsdWdpbnM7XG5cbiAgaWYgKCFwbHVnaW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3BsdWdpbiBub3Qgc3BlY2lmaWVkJyk7XG4gIH1cblxuICBpZiAoIXR5cGUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3R5cGUgbm90IHNwZWNpZmllZCcpO1xuICB9XG5cbiAgcGx1Z2lucy5wdXNoKHtcbiAgICBwbHVnaW46IHBsdWdpbixcbiAgICB0eXBlOiB0eXBlXG4gIH0pO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGNsaWVudCBwbHVnaW4uXG4gKlxuICogQHBhcmFtIHtpbXBvcnQoJ3JlYWN0JykuQ29tcG9uZW50VHlwZX0gZXh0ZW5zaW9uXG4gKlxuICogQGV4YW1wbGVcbiAqXG4gKiBpbXBvcnQgTXlFeHRlbnNpb25Db21wb25lbnQgZnJvbSAnLi9NeUV4dGVuc2lvbkNvbXBvbmVudCc7XG4gKlxuICogcmVnaXN0ZXJDbGllbnRFeHRlbnNpb24oTXlFeHRlbnNpb25Db21wb25lbnQpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDbGllbnRFeHRlbnNpb24oY29tcG9uZW50KSB7XG4gIHJlZ2lzdGVyQ2xpZW50UGx1Z2luKGNvbXBvbmVudCwgJ2NsaWVudCcpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGJwbW4tanMgcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGltcG9ydCB7XG4gKiAgIHJlZ2lzdGVyQnBtbkpTUGx1Z2luXG4gKiB9IGZyb20gJ2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycyc7XG4gKlxuICogY29uc3QgQnBtbkpTTW9kdWxlID0ge1xuICogICBfX2luaXRfXzogWyAnbXlTZXJ2aWNlJyBdLFxuICogICBteVNlcnZpY2U6IFsgJ3R5cGUnLCAuLi4gXVxuICogfTtcbiAqXG4gKiByZWdpc3RlckJwbW5KU1BsdWdpbihCcG1uSlNNb2R1bGUpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCcG1uSlNQbHVnaW4obW9kdWxlKSB7XG4gIHJlZ2lzdGVyQ2xpZW50UGx1Z2luKG1vZHVsZSwgJ2JwbW4ubW9kZWxlci5hZGRpdGlvbmFsTW9kdWxlcycpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIHBsYXRmb3JtIHNwZWNpZmljIGJwbW4tanMgcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGltcG9ydCB7XG4gKiAgIHJlZ2lzdGVyUGxhdGZvcm1CcG1uSlNQbHVnaW5cbiAqIH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzJztcbiAqXG4gKiBjb25zdCBCcG1uSlNNb2R1bGUgPSB7XG4gKiAgIF9faW5pdF9fOiBbICdteVNlcnZpY2UnIF0sXG4gKiAgIG15U2VydmljZTogWyAndHlwZScsIC4uLiBdXG4gKiB9O1xuICpcbiAqIHJlZ2lzdGVyUGxhdGZvcm1CcG1uSlNQbHVnaW4oQnBtbkpTTW9kdWxlKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUGxhdGZvcm1CcG1uSlNQbHVnaW4obW9kdWxlKSB7XG4gIHJlZ2lzdGVyQ2xpZW50UGx1Z2luKG1vZHVsZSwgJ2JwbW4ucGxhdGZvcm0ubW9kZWxlci5hZGRpdGlvbmFsTW9kdWxlcycpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGNsb3VkIHNwZWNpZmljIGJwbW4tanMgcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGltcG9ydCB7XG4gKiAgIHJlZ2lzdGVyQ2xvdWRCcG1uSlNQbHVnaW5cbiAqIH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzJztcbiAqXG4gKiBjb25zdCBCcG1uSlNNb2R1bGUgPSB7XG4gKiAgIF9faW5pdF9fOiBbICdteVNlcnZpY2UnIF0sXG4gKiAgIG15U2VydmljZTogWyAndHlwZScsIC4uLiBdXG4gKiB9O1xuICpcbiAqIHJlZ2lzdGVyQ2xvdWRCcG1uSlNQbHVnaW4oQnBtbkpTTW9kdWxlKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ2xvdWRCcG1uSlNQbHVnaW4obW9kdWxlKSB7XG4gIHJlZ2lzdGVyQ2xpZW50UGx1Z2luKG1vZHVsZSwgJ2JwbW4uY2xvdWQubW9kZWxlci5hZGRpdGlvbmFsTW9kdWxlcycpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGJwbW4tbW9kZGxlIGV4dGVuc2lvbiBwbHVnaW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3JcbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0IHtcbiAqICAgcmVnaXN0ZXJCcG1uSlNNb2RkbGVFeHRlbnNpb25cbiAqIH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzJztcbiAqXG4gKiB2YXIgbW9kZGxlRGVzY3JpcHRvciA9IHtcbiAqICAgbmFtZTogJ215IGRlc2NyaXB0b3InLFxuICogICB1cmk6ICdodHRwOi8vZXhhbXBsZS5teS5jb21wYW55LmxvY2FsaG9zdC9zY2hlbWEvbXktZGVzY3JpcHRvci8xLjAnLFxuICogICBwcmVmaXg6ICdteWRlc2MnLFxuICpcbiAqICAgLi4uXG4gKiB9O1xuICpcbiAqIHJlZ2lzdGVyQnBtbkpTTW9kZGxlRXh0ZW5zaW9uKG1vZGRsZURlc2NyaXB0b3IpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJCcG1uSlNNb2RkbGVFeHRlbnNpb24oZGVzY3JpcHRvcikge1xuICByZWdpc3RlckNsaWVudFBsdWdpbihkZXNjcmlwdG9yLCAnYnBtbi5tb2RlbGVyLm1vZGRsZUV4dGVuc2lvbicpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIHBsYXRmb3JtIHNwZWNpZmljIGJwbW4tbW9kZGxlIGV4dGVuc2lvbiBwbHVnaW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3JcbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0IHtcbiAqICAgcmVnaXN0ZXJQbGF0Zm9ybUJwbW5KU01vZGRsZUV4dGVuc2lvblxuICogfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMnO1xuICpcbiAqIHZhciBtb2RkbGVEZXNjcmlwdG9yID0ge1xuICogICBuYW1lOiAnbXkgZGVzY3JpcHRvcicsXG4gKiAgIHVyaTogJ2h0dHA6Ly9leGFtcGxlLm15LmNvbXBhbnkubG9jYWxob3N0L3NjaGVtYS9teS1kZXNjcmlwdG9yLzEuMCcsXG4gKiAgIHByZWZpeDogJ215ZGVzYycsXG4gKlxuICogICAuLi5cbiAqIH07XG4gKlxuICogcmVnaXN0ZXJQbGF0Zm9ybUJwbW5KU01vZGRsZUV4dGVuc2lvbihtb2RkbGVEZXNjcmlwdG9yKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUGxhdGZvcm1CcG1uSlNNb2RkbGVFeHRlbnNpb24oZGVzY3JpcHRvcikge1xuICByZWdpc3RlckNsaWVudFBsdWdpbihkZXNjcmlwdG9yLCAnYnBtbi5wbGF0Zm9ybS5tb2RlbGVyLm1vZGRsZUV4dGVuc2lvbicpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGNsb3VkIHNwZWNpZmljIGJwbW4tbW9kZGxlIGV4dGVuc2lvbiBwbHVnaW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3JcbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0IHtcbiAqICAgcmVnaXN0ZXJDbG91ZEJwbW5KU01vZGRsZUV4dGVuc2lvblxuICogfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMnO1xuICpcbiAqIHZhciBtb2RkbGVEZXNjcmlwdG9yID0ge1xuICogICBuYW1lOiAnbXkgZGVzY3JpcHRvcicsXG4gKiAgIHVyaTogJ2h0dHA6Ly9leGFtcGxlLm15LmNvbXBhbnkubG9jYWxob3N0L3NjaGVtYS9teS1kZXNjcmlwdG9yLzEuMCcsXG4gKiAgIHByZWZpeDogJ215ZGVzYycsXG4gKlxuICogICAuLi5cbiAqIH07XG4gKlxuICogcmVnaXN0ZXJDbG91ZEJwbW5KU01vZGRsZUV4dGVuc2lvbihtb2RkbGVEZXNjcmlwdG9yKTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ2xvdWRCcG1uSlNNb2RkbGVFeHRlbnNpb24oZGVzY3JpcHRvcikge1xuICByZWdpc3RlckNsaWVudFBsdWdpbihkZXNjcmlwdG9yLCAnYnBtbi5jbG91ZC5tb2RlbGVyLm1vZGRsZUV4dGVuc2lvbicpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGRtbi1tb2RkbGUgZXh0ZW5zaW9uIHBsdWdpbi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZGVzY3JpcHRvclxuICpcbiAqIEBleGFtcGxlXG4gKiBpbXBvcnQge1xuICogICByZWdpc3RlckRtbkpTTW9kZGxlRXh0ZW5zaW9uXG4gKiB9IGZyb20gJ2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycyc7XG4gKlxuICogdmFyIG1vZGRsZURlc2NyaXB0b3IgPSB7XG4gKiAgIG5hbWU6ICdteSBkZXNjcmlwdG9yJyxcbiAqICAgdXJpOiAnaHR0cDovL2V4YW1wbGUubXkuY29tcGFueS5sb2NhbGhvc3Qvc2NoZW1hL215LWRlc2NyaXB0b3IvMS4wJyxcbiAqICAgcHJlZml4OiAnbXlkZXNjJyxcbiAqXG4gKiAgIC4uLlxuICogfTtcbiAqXG4gKiByZWdpc3RlckRtbkpTTW9kZGxlRXh0ZW5zaW9uKG1vZGRsZURlc2NyaXB0b3IpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEbW5KU01vZGRsZUV4dGVuc2lvbihkZXNjcmlwdG9yKSB7XG4gIHJlZ2lzdGVyQ2xpZW50UGx1Z2luKGRlc2NyaXB0b3IsICdkbW4ubW9kZWxlci5tb2RkbGVFeHRlbnNpb24nKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbmQgcmVnaXN0ZXIgYSBjbG91ZCBzcGVjaWZpYyBkbW4tbW9kZGxlIGV4dGVuc2lvbiBwbHVnaW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRlc2NyaXB0b3JcbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0IHtcbiAqICAgcmVnaXN0ZXJDbG91ZERtbkpTTW9kZGxlRXh0ZW5zaW9uXG4gKiB9IGZyb20gJ2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycyc7XG4gKlxuICogdmFyIG1vZGRsZURlc2NyaXB0b3IgPSB7XG4gKiAgIG5hbWU6ICdteSBkZXNjcmlwdG9yJyxcbiAqICAgdXJpOiAnaHR0cDovL2V4YW1wbGUubXkuY29tcGFueS5sb2NhbGhvc3Qvc2NoZW1hL215LWRlc2NyaXB0b3IvMS4wJyxcbiAqICAgcHJlZml4OiAnbXlkZXNjJyxcbiAqXG4gKiAgIC4uLlxuICogfTtcbiAqXG4gKiByZWdpc3RlckNsb3VkRG1uSlNNb2RkbGVFeHRlbnNpb24obW9kZGxlRGVzY3JpcHRvcik7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNsb3VkRG1uSlNNb2RkbGVFeHRlbnNpb24oZGVzY3JpcHRvcikge1xuICByZWdpc3RlckNsaWVudFBsdWdpbihkZXNjcmlwdG9yLCAnZG1uLmNsb3VkLm1vZGVsZXIubW9kZGxlRXh0ZW5zaW9uJyk7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgYW5kIHJlZ2lzdGVyIGEgcGxhdGZvcm0gc3BlY2lmaWMgZG1uLW1vZGRsZSBleHRlbnNpb24gcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkZXNjcmlwdG9yXG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCB7XG4gKiAgIHJlZ2lzdGVyUGxhdGZvcm1EbW5KU01vZGRsZUV4dGVuc2lvblxuICogfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMnO1xuICpcbiAqIHZhciBtb2RkbGVEZXNjcmlwdG9yID0ge1xuICogICBuYW1lOiAnbXkgZGVzY3JpcHRvcicsXG4gKiAgIHVyaTogJ2h0dHA6Ly9leGFtcGxlLm15LmNvbXBhbnkubG9jYWxob3N0L3NjaGVtYS9teS1kZXNjcmlwdG9yLzEuMCcsXG4gKiAgIHByZWZpeDogJ215ZGVzYycsXG4gKlxuICogICAuLi5cbiAqIH07XG4gKlxuICogcmVnaXN0ZXJQbGF0Zm9ybURtbkpTTW9kZGxlRXh0ZW5zaW9uKG1vZGRsZURlc2NyaXB0b3IpO1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQbGF0Zm9ybURtbkpTTW9kZGxlRXh0ZW5zaW9uKGRlc2NyaXB0b3IpIHtcbiAgcmVnaXN0ZXJDbGllbnRQbHVnaW4oZGVzY3JpcHRvciwgJ2Rtbi5wbGF0Zm9ybS5tb2RlbGVyLm1vZGRsZUV4dGVuc2lvbicpO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuZCByZWdpc3RlciBhIGRtbi1qcyBwbHVnaW4uXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG1vZHVsZVxuICpcbiAqIEBleGFtcGxlXG4gKlxuICogaW1wb3J0IHtcbiAqICAgcmVnaXN0ZXJEbW5KU1BsdWdpblxuICogfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMnO1xuICpcbiAqIGNvbnN0IERtbkpTTW9kdWxlID0ge1xuICogICBfX2luaXRfXzogWyAnbXlTZXJ2aWNlJyBdLFxuICogICBteVNlcnZpY2U6IFsgJ3R5cGUnLCAuLi4gXVxuICogfTtcbiAqXG4gKiByZWdpc3RlckRtbkpTUGx1Z2luKERtbkpTTW9kdWxlLCBbICdkcmQnLCAnbGl0ZXJhbEV4cHJlc3Npb24nIF0pO1xuICogcmVnaXN0ZXJEbW5KU1BsdWdpbihEbW5KU01vZHVsZSwgJ2RyZCcpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRtbkpTUGx1Z2luKG1vZHVsZSwgY29tcG9uZW50cykge1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgIGNvbXBvbmVudHMgPSBbIGNvbXBvbmVudHMgXVxuICB9XG5cbiAgY29tcG9uZW50cy5mb3JFYWNoKGMgPT4gcmVnaXN0ZXJDbGllbnRQbHVnaW4obW9kdWxlLCBgZG1uLm1vZGVsZXIuJHtjfS5hZGRpdGlvbmFsTW9kdWxlc2ApKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbmQgcmVnaXN0ZXIgYSBjbG91ZCBzcGVjaWZpYyBkbW4tanMgcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGltcG9ydCB7XG4gKiAgIHJlZ2lzdGVyQ2xvdWREbW5KU1BsdWdpblxuICogfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMnO1xuICpcbiAqIGNvbnN0IERtbkpTTW9kdWxlID0ge1xuICogICBfX2luaXRfXzogWyAnbXlTZXJ2aWNlJyBdLFxuICogICBteVNlcnZpY2U6IFsgJ3R5cGUnLCAuLi4gXVxuICogfTtcbiAqXG4gKiByZWdpc3RlckNsb3VkRG1uSlNQbHVnaW4oRG1uSlNNb2R1bGUsIFsgJ2RyZCcsICdsaXRlcmFsRXhwcmVzc2lvbicgXSk7XG4gKiByZWdpc3RlckNsb3VkRG1uSlNQbHVnaW4oRG1uSlNNb2R1bGUsICdkcmQnKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDbG91ZERtbkpTUGx1Z2luKG1vZHVsZSwgY29tcG9uZW50cykge1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgIGNvbXBvbmVudHMgPSBbIGNvbXBvbmVudHMgXVxuICB9XG5cbiAgY29tcG9uZW50cy5mb3JFYWNoKGMgPT4gcmVnaXN0ZXJDbGllbnRQbHVnaW4obW9kdWxlLCBgZG1uLmNsb3VkLm1vZGVsZXIuJHtjfS5hZGRpdGlvbmFsTW9kdWxlc2ApKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbmQgcmVnaXN0ZXIgYSBwbGF0Zm9ybSBzcGVjaWZpYyBkbW4tanMgcGx1Z2luLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2R1bGVcbiAqXG4gKiBAZXhhbXBsZVxuICpcbiAqIGltcG9ydCB7XG4gKiAgIHJlZ2lzdGVyUGxhdGZvcm1EbW5KU1BsdWdpblxuICogfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMnO1xuICpcbiAqIGNvbnN0IERtbkpTTW9kdWxlID0ge1xuICogICBfX2luaXRfXzogWyAnbXlTZXJ2aWNlJyBdLFxuICogICBteVNlcnZpY2U6IFsgJ3R5cGUnLCAuLi4gXVxuICogfTtcbiAqXG4gKiByZWdpc3RlclBsYXRmb3JtRG1uSlNQbHVnaW4oRG1uSlNNb2R1bGUsIFsgJ2RyZCcsICdsaXRlcmFsRXhwcmVzc2lvbicgXSk7XG4gKiByZWdpc3RlclBsYXRmb3JtRG1uSlNQbHVnaW4oRG1uSlNNb2R1bGUsICdkcmQnKVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJQbGF0Zm9ybURtbkpTUGx1Z2luKG1vZHVsZSwgY29tcG9uZW50cykge1xuXG4gIGlmICghQXJyYXkuaXNBcnJheShjb21wb25lbnRzKSkge1xuICAgIGNvbXBvbmVudHMgPSBbIGNvbXBvbmVudHMgXVxuICB9XG5cbiAgY29tcG9uZW50cy5mb3JFYWNoKGMgPT4gcmVnaXN0ZXJDbGllbnRQbHVnaW4obW9kdWxlLCBgZG1uLnBsYXRmb3JtLm1vZGVsZXIuJHtjfS5hZGRpdGlvbmFsTW9kdWxlc2ApKTtcbn1cblxuLyoqXG4gKiBSZXR1cm4gdGhlIG1vZGVsZXIgZGlyZWN0b3J5LCBhcyBhIHN0cmluZy5cbiAqXG4gKiBAZGVwcmVjYXRlZCBXaWxsIGJlIHJlbW92ZWQgaW4gZnV0dXJlIENhbXVuZGEgTW9kZWxlciB2ZXJzaW9ucyB3aXRob3V0IHJlcGxhY2VtZW50LlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZGVsZXJEaXJlY3RvcnkoKSB7XG4gIHJldHVybiB3aW5kb3cuZ2V0TW9kZWxlckRpcmVjdG9yeSgpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbW9kZWxlciBwbHVnaW4gZGlyZWN0b3J5LCBhcyBhIHN0cmluZy5cbiAqXG4gKiBAZGVwcmVjYXRlZCBXaWxsIGJlIHJlbW92ZWQgaW4gZnV0dXJlIENhbXVuZGEgTW9kZWxlciB2ZXJzaW9ucyB3aXRob3V0IHJlcGxhY2VtZW50LlxuICpcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBsdWdpbnNEaXJlY3RvcnkoKSB7XG4gIHJldHVybiB3aW5kb3cuZ2V0UGx1Z2luc0RpcmVjdG9yeSgpO1xufSIsImlmICghd2luZG93LnJlYWN0KSB7XG4gIHRocm93IG5ldyBFcnJvcignTm90IGNvbXBhdGlibGUgd2l0aCBDYW11bmRhIE1vZGVsZXIgPCAzLjQnKTtcbn1cblxuLyoqXG4gKiBSZWFjdCBvYmplY3QgdXNlZCBieSBDYW11bmRhIE1vZGVsZXIuIFVzZSBpdCB0byBjcmVhdGUgVUkgZXh0ZW5zaW9uLlxuICpcbiAqIEB0eXBlIHtpbXBvcnQoJ3JlYWN0Jyl9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gd2luZG93LnJlYWN0OyIsIi8qKlxuICogQ29weXJpZ2h0IENhbXVuZGEgU2VydmljZXMgR21iSCBhbmQvb3IgbGljZW5zZWQgdG8gQ2FtdW5kYSBTZXJ2aWNlcyBHbWJIXG4gKiB1bmRlciBvbmUgb3IgbW9yZSBjb250cmlidXRvciBsaWNlbnNlIGFncmVlbWVudHMuIFNlZSB0aGUgTk9USUNFIGZpbGVcbiAqIGRpc3RyaWJ1dGVkIHdpdGggdGhpcyB3b3JrIGZvciBhZGRpdGlvbmFsIGluZm9ybWF0aW9uIHJlZ2FyZGluZyBjb3B5cmlnaHRcbiAqIG93bmVyc2hpcC5cbiAqXG4gKiBDYW11bmRhIGxpY2Vuc2VzIHRoaXMgZmlsZSB0byB5b3UgdW5kZXIgdGhlIE1JVDsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZVxuICogZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTUlUIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IFJlYWN0LCB7IHVzZUVmZmVjdCB9IGZyb20gJ2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycy9yZWFjdCc7XG5cbmltcG9ydCB7IEZpbGwsIE1vZGFsIH0gZnJvbSAnY2FtdW5kYS1tb2RlbGVyLXBsdWdpbi1oZWxwZXJzL2NvbXBvbmVudHMnO1xuXG5pbXBvcnQgeyBCdXR0b24sIFRoZW1lLCBJY29uQnV0dG9uLCBUZXh0SW5wdXQgfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMvQGNhcmJvbi9yZWFjdCc7XG5pbXBvcnQgeyBBZGQgfSBmcm9tICdjYW11bmRhLW1vZGVsZXItcGx1Z2luLWhlbHBlcnMvQGNhcmJvbi9pY29ucy1yZWFjdCc7XG5cbi8vIGltcG9ydCAnLi9UZXN0Q2FyYm9uLnNjc3MnO1xuXG5leHBvcnQgZnVuY3Rpb24gVGVzdENhcmJvbigpIHtcblxuICBjb25zdCBbIG1vZGFsT3Blbiwgc2V0TW9kYWxPcGVuIF0gPSBSZWFjdC51c2VTdGF0ZShmYWxzZSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnW1Rlc3RDYXJib25dIG1vdW50ZWQnKTtcbiAgfSwgW10pO1xuXG4gIGNvbnN0IGNsb3NlID0gKCkgPT4ge1xuICAgIHNldE1vZGFsT3BlbihmYWxzZSk7XG4gIH07XG5cbiAgcmV0dXJuIDxSZWFjdC5GcmFnbWVudD5cbiAgICB7IG1vZGFsT3BlbiAmJiA8Q2FyYm9uTW9kYWwgb25DbG9zZT17IGNsb3NlIH0gLz4gfVxuICAgIDxGaWxsIHNsb3Q9XCJzdGF0dXMtYmFyX19hcHBcIiBncm91cD1cIjFfZmlyc3RcIj5cbiAgICAgIDxidXR0b25cbiAgICAgICAgY2xhc3NOYW1lPVwiYnRuXCJcbiAgICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICAgIG9uQ2xpY2s9eyAoKSA9PiBzZXRNb2RhbE9wZW4odHJ1ZSkgfVxuICAgICAgPlxuICAgICAgICBDYXJib25cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvRmlsbD5cbiAgPC9SZWFjdC5GcmFnbWVudD47XG59XG5cbmZ1bmN0aW9uIENhcmJvbk1vZGFsKHsgb25DbG9zZSB9KSB7XG5cbiAgcmV0dXJuIChcbiAgICA8TW9kYWwgY2xhc3NOYW1lPVwibW9kYWwtdGVzdC1jYXJib25cIj5cbiAgICAgIDxNb2RhbC5UaXRsZT5UZXN0IENhcmJvbjwvTW9kYWwuVGl0bGU+XG4gICAgICA8TW9kYWwuQm9keT5cbiAgICAgICAgPGgxPkNhcmJvbjwvaDE+XG4gICAgICAgIDxUaGVtZSB0aGVtZT1cImc5MFwiPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cImNhcmJvbi1wYWRkaW5nXCI+Q2FyYm9uIGlzIGNvb2w8L3A+XG4gICAgICAgIDwvVGhlbWU+XG4gICAgICAgIDxwIGNsYXNzTmFtZT1cImNhcmJvbi1jb2xvclwiPkNhcmJvbiBpcyBjb2xvcmZ1bDwvcD5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8VGV4dElucHV0XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJpbnB1dC10ZXN0LWNsYXNzXCJcbiAgICAgICAgICAgIGRlZmF1bHRXaWR0aD17IDMwMCB9XG4gICAgICAgICAgICBoZWxwZXJUZXh0PVwiSGVscGVyIHRleHRcIlxuICAgICAgICAgICAgaWQ9XCJ0ZXh0LWlucHV0LTFcIlxuICAgICAgICAgICAgaW52YWxpZFRleHQ9XCJFcnJvciBtZXNzYWdlIGdvZXMgaGVyZVwiXG4gICAgICAgICAgICBsYWJlbFRleHQ9XCJMYWJlbCB0ZXh0XCJcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwiUGxhY2Vob2xkZXIgdGV4dFwiXG4gICAgICAgICAgICBzaXplPVwibWRcIlxuICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgIC8+XG4gICAgICAgICAgPEljb25CdXR0b24gbGFiZWw9XCJBZGRcIj5cbiAgICAgICAgICAgIDxBZGQgLz5cbiAgICAgICAgICA8L0ljb25CdXR0b24+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9Nb2RhbC5Cb2R5PlxuICAgICAgPE1vZGFsLkZvb3Rlcj5cbiAgICAgICAgPEJ1dHRvbiBvbkNsaWNrPXsgb25DbG9zZSB9Pk9LPC9CdXR0b24+XG4gICAgICA8L01vZGFsLkZvb3Rlcj5cbiAgICA8L01vZGFsPlxuICApO1xufSIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuX193ZWJwYWNrX3JlcXVpcmVfXy5uID0gKG1vZHVsZSkgPT4ge1xuXHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cblx0XHQoKSA9PiAobW9kdWxlWydkZWZhdWx0J10pIDpcblx0XHQoKSA9PiAobW9kdWxlKTtcblx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgeyBhOiBnZXR0ZXIgfSk7XG5cdHJldHVybiBnZXR0ZXI7XG59OyIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyByZWdpc3RlckNsaWVudEV4dGVuc2lvbiB9IGZyb20gJ2NhbXVuZGEtbW9kZWxlci1wbHVnaW4taGVscGVycyc7XG5cbmltcG9ydCB7IFRlc3RDYXJib24gfSBmcm9tICcuL1Rlc3RDYXJib24nO1xuXG5yZWdpc3RlckNsaWVudEV4dGVuc2lvbihUZXN0Q2FyYm9uKTsiXSwibmFtZXMiOlsiUmVhY3QiLCJ1c2VFZmZlY3QiLCJGaWxsIiwiTW9kYWwiLCJCdXR0b24iLCJUaGVtZSIsIkljb25CdXR0b24iLCJUZXh0SW5wdXQiLCJBZGQiLCJUZXN0Q2FyYm9uIiwibW9kYWxPcGVuIiwic2V0TW9kYWxPcGVuIiwidXNlU3RhdGUiLCJjb25zb2xlIiwibG9nIiwiY2xvc2UiLCJjcmVhdGVFbGVtZW50IiwiRnJhZ21lbnQiLCJDYXJib25Nb2RhbCIsIm9uQ2xvc2UiLCJzbG90IiwiZ3JvdXAiLCJjbGFzc05hbWUiLCJ0eXBlIiwib25DbGljayIsIlRpdGxlIiwiQm9keSIsInRoZW1lIiwiZGVmYXVsdFdpZHRoIiwiaGVscGVyVGV4dCIsImlkIiwiaW52YWxpZFRleHQiLCJsYWJlbFRleHQiLCJwbGFjZWhvbGRlciIsInNpemUiLCJsYWJlbCIsIkZvb3RlciIsInJlZ2lzdGVyQ2xpZW50RXh0ZW5zaW9uIl0sInNvdXJjZVJvb3QiOiIifQ==