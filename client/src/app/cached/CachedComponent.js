import { Component } from 'react';

export default class CachedComponent extends Component {

  getCached() {
    return this.props.cachedState;
  }

  setCached(state) {
    this.props.setCachedState(state);
  }

}