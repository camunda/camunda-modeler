import React, { Component } from 'react';

import EventsContext from './EventsContext';


export default function WithEvents(Comp) {

  return class WithEventsComponent extends Component {

    render() {

      const props = this.props;

      return (
        <EventsContext.Consumer>{
          (events) => {
            return <Comp { ...props } events={ events } />
          }
        }</EventsContext.Consumer>
      );
    }
  }
}