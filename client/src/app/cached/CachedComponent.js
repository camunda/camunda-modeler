import { PureComponent } from 'react';

export default class CachedComponent extends PureComponent {

  getCached() {
    return this.props.cachedState;
  }

  setCached(state) {
    this.props.setCachedState(state);
  }

}