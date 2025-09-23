/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import debug from 'debug';

import React, { PureComponent } from 'react';

import PluginParent from './PluginParent';

const log = debug('app:plugins');


export default class PluginsRoot extends PureComponent {

  constructor(props) {

    super(props);

    const {
      app,
      plugins
    } = props;

    this.config = app.getGlobal('config');
    this.settings = app.getGlobal('settings');

    // this is non-reactive, by design
    this.pluginsAndSubscribers = plugins.map(plugin => {

      const subscriber = createSubscriber(app);
      const name = plugin.displayName || plugin.name;

      return {
        name,
        plugin,
        subscriber
      };
    });

  }

  log = options => this.props.app.triggerAction('log', options);

  displayNotification = options => this.props.app.triggerAction('display-notification', options);

  render() {

    const {
      app
    } = this.props;

    const {
      config,
      settings,
      pluginsAndSubscribers
    } = this;

    const pluginSettings = {
      register: settings.register.bind(settings),
      get: settings.get.bind(settings),
      set: settings.set.bind(settings),
      subscribe: settings.subscribe.bind(settings),
    };

    return pluginsAndSubscribers.map((pluginAndSubscriber, index) => {

      const {
        name,
        plugin: PluginComponent,
        subscriber
      } = pluginAndSubscriber;

      const {
        cancelAll,
        subscribe
      } = subscriber;

      const getFromApp = (prop) => app[prop];

      log('render plug-in', name);

      return (
        <PluginParent
          key={ name || index }
          name={ name || index }
          cancelSubscriptions={ cancelAll }
          onError={ app.handleError }
        >
          <PluginComponent
            triggerAction={ app.triggerAction }
            config={ config }
            getConfig={ app.getConfig }
            setConfig={ app.setConfig }
            subscribe={ subscribe }
            log={ this.log }
            displayNotification={ this.displayNotification }
            settings={ pluginSettings }
            _getFromApp={ getFromApp }
            _getGlobal={ app.getGlobal }
          />
        </PluginParent>
      );
    });
  }
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
