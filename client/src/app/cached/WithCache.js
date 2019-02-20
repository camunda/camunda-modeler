/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
              ref={ forwardedRef } />;
          }
        }</CacheContext.Consumer>
      );
    }
  }

  return React.forwardRef((props, ref) => {
    return <WithCache { ...props } forwardedRef={ ref } />;
  });
}