import React, { Component } from 'react';


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
export default function WithCachedState(Comp) {

  class LazyInitiating extends Component {

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
            ? Comp.createCachedState()
            : {};

        cachedState = cache.add(id, initialCachedState);
      }

      this.state = cachedState;
    }

    setCachedState = (state) => {

      const {
        cache,
        id
      } = this.props;

      const newState = {
        ...this.state,
        ...state,
        __destroy: this.state.__destroy
      };

      cache.add(id, newState);

      this.setState(newState);
    }


    render() {
      console.log('%cLazyInstantiating#render', 'background: #52B415; color: white; padding: 2px 4px');

      const {
        cache,
        forwardedRef,
        ...rest
      } = this.props;

      const {
        // eslint-disable-next-line
        __destroy,
        ...cachedState
      } = this.state;

      return (
        <Comp
          { ...rest }
          ref={ forwardedRef }
          cachedState={ cachedState }
          setCachedState={ this.setCachedState } />
      );
    };
  }

  return React.forwardRef((props, ref) => {
    return <LazyInitiating {...props} forwardedRef={ref} />;
  });
}
