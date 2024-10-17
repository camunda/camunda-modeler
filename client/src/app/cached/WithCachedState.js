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


/**
 * A higher order component that lazily
 * initiates the given wrapped component
 * via the `Comp#createCachedState` method.
 *
 * Passes props as well as destructured
 * wrapped component state to `Comp`.
 *
 * The resulting component must be called
 * with the `id` and `cache` prop.
 *
 * Forwards refs, too.
 *
 * @param {Component} Comp
 */
export default function(Comp) {

  class WithCachedState extends PureComponent {

    constructor(props) {
      super(props);

      const {
        id,
        cache
      } = this.props;

      if (!cache) {
        throw new Error('<cache> prop required');
      }

      if (!id) {
        throw new Error('<id> prop required');
      }

      let cachedState = cache.get(id);

      if (!cachedState) {

        const initialCachedState =
          'createCachedState' in Comp
            ? Comp.createCachedState(this.props)
            : {};

        const {
          __destroy,
          ...cached
        } = initialCachedState;

        cachedState = cache.add(id, {
          cached,
          __destroy
        });
      }

      this.state = cachedState;
    }

    setCachedState = (newState) => {
      this.setState(function(state, props) {
        const {
          cache,
          id
        } = props;

        newState = {
          cached: {
            ...state.cached,
            ...newState
          },
          __destroy: state.__destroy
        };

        cache.add(id, newState);

        return newState;
      });
    };


    render() {

      const {
        forwardedRef,
        ...rest
      } = this.props;

      const {
        __destroy,
        cached
      } = this.state;

      return (
        <Comp
          { ...rest }
          ref={ forwardedRef }
          cachedState={ cached }
          setCachedState={ this.setCachedState } />
      );
    }
  }

  return React.forwardRef((props, ref) => {
    return <WithCachedState { ...props } forwardedRef={ ref } />;
  });
}
