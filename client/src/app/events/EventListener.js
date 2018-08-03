import { Component } from 'react';

import WithEvents from './WithEvents';

class EventListener extends Component {
  componentDidMount() {
    const { events, event, priority, handler } = this.props;

    events.on(event, priority || 1000, handler);
  }

  componentWillUnmount() {
    const { events, event, handler } = this.props;

    events.on(event, handler);
  }

  render() {
    return null;
  }
}

export default WithEvents(EventListener);