import React, { Component } from 'react';

import FillContext from './FillContext';
import SlotContext from './SlotContext';


export default class SlotFillRoot extends Component {

  constructor(props) {
    super(props);

    this.state = {
      fills: []
    };

    this.uid = 7913;

    this.fillContext = {

      addFill: (id, name, children) => {
        if (!id) {
          id = this.uid++;
        }

        this.setState((state) => {

          let found = false;

          const newFill = {
            id,
            name,
            children
          };

          const newFills = state.fills.map(function(fill) {

            if (fill.id === id) {
              found = true;

              return newFill;
            }

            return fill;
          });

          if (!found) {
            newFills.push(newFill);
          }

          return {
            fills: newFills
          };
        });

        return id;
      },

      removeFill: (id) => {
        this.setState((state) => {
          return {
            fills: state.fills.filter(f => f.id !== id)
          };
        });
      }
    };

  }

  render() {

    const slotContext = this.state;
    const fillContext = this.fillContext;

    const { children } = this.props;

    return (
      <SlotContext.Provider value={ slotContext }>
        <FillContext.Provider value={ fillContext }>
          { children }
        </FillContext.Provider>
      </SlotContext.Provider>
    );
  }
}