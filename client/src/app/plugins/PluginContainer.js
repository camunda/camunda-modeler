/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import css from './PluginContainer.less';


export default class PluginContainer extends PureComponent {

  static defaultProps = {
    onError: () => {},
    cancelSubscriptions: () => {}
  }

  static getDerivedStateFromError() {
    return { error: true };
  }

  state = { error: false }

  componentDidCatch(error) {
    this.props.cancelSubscriptions();

    this.props.onError(error, 'plugin:' + this.props.name);
  }

  componentWillUnmount() {
    this.props.cancelSubscriptions();
  }

  render() {
    return this.state.error ?
      null :
      <div className={ css.PluginContainer }>{ this.props.children }</div>;
  }
}
