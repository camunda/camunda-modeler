import React, { Component, Fragment } from 'react';

import SlotContext from './SlotContext';


export default class Slot extends Component {

  render() {
    const {
      name
    } = this.props;

    return (
      <SlotContext.Consumer>{
        ({ fills }) => {
          return (
            fills
              .filter(fill => {
                return fill.name === name;
              })
              .map(fill => {
                return <Fragment key={fill.id}>{fill.children}</Fragment>;
              })
          );
        }
      }</SlotContext.Consumer>
    );
  }

}