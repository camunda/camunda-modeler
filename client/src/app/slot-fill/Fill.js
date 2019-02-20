/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { PureComponent } from 'react';

import FillContext from './FillContext';


export default class Fill extends PureComponent {

  render() {

    const props = this.props;

    return (
      <FillContext.Consumer>{
        (context) => {
          return (
            <ActualFill { ...props } fillContext={ context } />
          );
        }
      }</FillContext.Consumer>
    );
  }
}


class ActualFill extends PureComponent {

  componentWillUnmount() {
    this._deregister();
  }

  componentDidMount() {
    this._register();
  }

  componentDidUpdate() {
    this._register();
  }

  render() {
    return null;
  }

  _deregister() {
    const {
      fillContext
    } = this.props;

    fillContext.removeFill(this);
  }

  _register() {

    const {
      fillContext
    } = this.props;

    fillContext.addFill(this);
  }
}