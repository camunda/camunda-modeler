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

import FillContext from './FillContext';
import SlotContext from './SlotContext';


/**
 * The slot fill root component that provides
 * access to registered fills and a fillContext
 * that may be used to register a new fill.
 *
 * <Slot> and <Fill> must be nested inside this context.
 */
export default class SlotFillRoot extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      fills: []
    };

    this.uid = 7913;

    this.fillContext = {

      /**
       * Add the given fill to the list of fills.
       *
       * @return {number} id assigned to the fill
       */
      addFill: (newFill) => {

        let id = newFill.id;

        if (!id) {
          id = newFill.id = this.uid++;
        }

        this.setState((state) => {

          let found = false;

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

      /**
       * Remove the given fill from the list of fills.
       */
      removeFill: (fill) => {
        this.setState((state) => {
          return {
            fills: state.fills.filter(f => f.id !== fill.id)
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