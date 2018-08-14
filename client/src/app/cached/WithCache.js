import React, { Component } from 'react';

import CacheContext from './CacheContext';

/**
 * A higher order component that passes cache to a wrapped component.
 * Forwards refs, too.
 */
export default function WithCache(Comp) {

  class WithCache extends Component {
    render() {
      console.log('%cWithCache#render', 'background: #52B415; color: white; padding: 2px 4px');
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