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

import CacheContext from './CacheContext';

/**
 * A higher order component that passes cache to a wrapped component.
 * Forwards refs, too.
 */
export default function WithCache(Comp) {

  class WithCache extends PureComponent {
    render() {
      const { forwardedRef, ...rest } = this.props;

      return (
        <CacheContext.Consumer>{
          (cache) => {
            return <Comp
              { ...rest }
              cache={ cache }
              ref={ forwardedRef }
            />;
          }
        }</CacheContext.Consumer>
      );
    }
  }

  return React.forwardRef((props, ref) => {
    return <WithCache { ...props } forwardedRef={ ref } />;
  });
}
