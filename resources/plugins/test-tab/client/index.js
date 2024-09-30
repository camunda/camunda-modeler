/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'camunda-modeler-plugin-helpers/react';

import { registerClientExtension, registerClientPlugin } from 'camunda-modeler-plugin-helpers';

import component from './robot';
import initialRobot from './robot/initial.robot';
import { Fill } from 'camunda-modeler-plugin-helpers/components';



const tab = {
  robot: {
    name: 'ROBOT',
    encoding: 'utf8',
    exports: {},
    extensions: [ 'robot' ],
    canOpen(file) {
      return file.name.endsWith('.robot');
    },
    getComponent(options) {
      return component;
    },
    getIcon() {
      return null;
    },
    getInitialContents() {
      return initialRobot;
    },
    getInitialFilename(suffix) {
      return `robot_${suffix}.robot`;
    },
    getHelpMenu() {
      return [];
    },
    getNewFileMenu() {
      return [ {
        label: 'Robot',
        group: 'Camunda 8',
        action: [ 'create-diagram', 'robot' ]
      } ];
    },
    getLinter() {
      return null;
    }
  }
};

const EmptyTabEntry = () => {
  return <Fill slot="cloud-welcome" action={ [ 'create-diagram', 'robot' ] } title="Robot" icon={ null } />;
};


registerClientPlugin(tab, 'tabs');
registerClientExtension(EmptyTabEntry);

