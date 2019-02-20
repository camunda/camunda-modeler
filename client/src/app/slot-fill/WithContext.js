/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import FillContext from './FillContext';


export default function(Component) {

  return function WithFillContext(props) {

    return (
      <FillContext.Consumer>{
        (fillContext) => {
          return (
            <WithFillContext { ...props } fillContext={ fillContext } />
          );
        }
      }</FillContext.Consumer>
    );
  };

}