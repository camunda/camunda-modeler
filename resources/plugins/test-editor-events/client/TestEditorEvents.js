/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { PureComponent } from 'camunda-modeler-plugin-helpers/react';

import BpmnModelerExtension from './bpmn-modeler-extension';


/**
 * An extension that shows how to hook into
 * editor events to accomplish the following:
 *
 * - hook into <bpmn.modeler.configure> to provide a bpmn.modeler extension
 * - hook into <bpmn.modeler.created> to register for bpmn.modeler events
 * - hook into <tab.saved> to perform a post-safe action
 *
 */
export default class TestEditorEvents extends PureComponent {

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

      middlewares.push(addModule(BpmnModelerExtension));
    });


    subscribe('bpmn.modeler.created', (event) => {

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

    });


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
