/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import * as ReactExports from 'react';

import React from 'react';

import PluginContainer from './PluginContainer';

import {
  Modal
} from '../primitives';

import { Fill } from '../slot-fill';


// bind React and components to window before the plugins are loaded
window.react = ReactExports;

window.react.React = React;

window.components = {
  Fill,
  Modal
};

export default function Plugins(props) {

  const {
    app
  } = props;

  const plugins = app.getPlugins('app.ui');

  return plugins.map(({ component: Plugin, props: customProps, name }, index) => {

    const {
      cancelAll,
      subscribe
    } = createSubscriber(app);

    return (
      <PluginContainer
        key={ name || index }
        name={ name || index }
        cancelSubscriptions={ cancelAll }
        onError={ app.handleError }
      >
        <Plugin
          { ...customProps }
          triggerAction={ app.triggerAction }
          subscribe={ subscribe }
          log={ app.composeAction('log') }
        />
      </PluginContainer>
    );
  });
}



// helpers ////////////
function createSubscriber(app) {
  let subscriptions = [];

  function subscribe(event, callback) {

    const subscription = {
      cancel
    };

    function cancel() {
      subscriptions = without(subscriptions, subscription);

      app.off(event, callback);
    }

    app.on(event, callback);

    subscriptions = [ ...subscriptions, subscription ];

    return subscription;
  }


  function cancelAll() {
    subscriptions.forEach(subscription => subscription.cancel());
  }

  return {
    cancelAll,
    subscribe
  };
}

function without(arrayLike, element) {
  return arrayLike.filter(currentElement => currentElement !== element);
}
