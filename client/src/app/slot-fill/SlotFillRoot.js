/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from "react";

import FillContext from "./FillContext";
import SlotContext from "./SlotContext";

const SLOT_FILL_DEBUG = process.env.REACT_SLOT_FILL_DEBUG === "true";

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

    this.uid = 7913;

    this._fills = [];
    this._listeners = new Set();
    this._debugRegistrations = new Map();

    this.slotContext = {
      fills: this._fills,
      getFills: () => this._fills,
      subscribe: (listener) => {
        this._listeners.add(listener);

        return () => {
          this._listeners.delete(listener);
        };
      },
    };

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

        if (SLOT_FILL_DEBUG) {
          this._trackDebugRegistration(newFill);
        }

        let found = false;

        const fills = this._fills.map(function (fill) {
          if (fill.id === id) {
            found = true;

            if (SLOT_FILL_DEBUG) {
              const isSame = sameFill(fill, newFill);
              console.log(
                `[slot-fill] addFill id=${id} slot=${newFill.props?.slot} sameFill=${isSame}`,
                '(updating fill)'
              );
            }
            
            // Always return new fill to get updated children
            return newFill;
          }

          return fill;
        });

        if (!found) {
          fills.push(newFill);
        }

        // Always update to ensure Slots render latest children
        this._updateFills(fills);

        return id;
      },

      /**
       * Remove the given fill from the list of fills.
       */
      removeFill: (fillId) => {
        const fills = this._fills.filter((f) => f.id !== fillId);

        if (fills.length === this._fills.length) {
          return;
        }

        this._updateFills(fills);
      },
    };
  }

  render() {
    const { children } = this.props;

    return (
      <SlotContext.Provider value={this.slotContext}>
        <FillContext.Provider value={this.fillContext}>
          {children}
        </FillContext.Provider>
      </SlotContext.Provider>
    );
  }

  _updateFills(fills) {
    this._fills = fills;
    this.slotContext.fills = fills;

    this._listeners.forEach((listener) => {
      listener(fills);
    });
  }

  _trackDebugRegistration(fill) {
    const current = this._debugRegistrations.get(fill.id) || { count: 0, timeout: null };

    current.count++;

    if (current.timeout) {
      clearTimeout(current.timeout);
    }

    current.timeout = setTimeout(() => {
      this._debugRegistrations.delete(fill.id);
    }, 250);

    this._debugRegistrations.set(fill.id, current);

    if (current.count === 10) {
      console.warn(
        `[slot-fill] rapid re-registration id=${fill.id} slot=${fill.props && fill.props.slot} label=${getDebugLabel(fill.props || {})}`,
        {
          fillProps: summarizeFill(fill.props || {}),
        },
      );
    }
  }
}

function sameFill(a, b) {
  const aProps = a.props || {};
  const bProps = b.props || {};

  // Get keys excluding 'children' which changes on every render
  const aKeys = Object.keys(aProps).filter(key => key !== 'children');
  const bKeys = Object.keys(bProps).filter(key => key !== 'children');

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  // Only compare non-children props
  return aKeys.every((key) => {
    const aValue = aProps[key];
    const bValue = bProps[key];

    // Fast path: same reference
    if (aValue === bValue) {
      return true;
    }

    // For arrays, do shallow comparison
    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      if (aValue.length !== bValue.length) {
        return false;
      }
      return aValue.every((item, index) => item === bValue[index]);
    }

    // For other types, use shallow comparison
    return aValue === bValue;
  });
}

function summarizeFill(props) {
  return Object.keys(props).reduce((summary, key) => {
    const value = props[key];

    if (React.isValidElement(value)) {
      summary[key] = `[element ${getElementTypeName(value.type)}]`;
    } else if (Array.isArray(value)) {
      summary[key] = `[array(${value.length})]`;
    } else if (typeof value === "function") {
      summary[key] = `[function ${value.name || "anonymous"}]`;
    } else if (value && typeof value === "object") {
      summary[key] = `[object ${Object.keys(value).join(",")}]`;
    } else {
      summary[key] = value;
    }

    return summary;
  }, {});
}

function getElementTypeName(type) {
  if (typeof type === "string") {
    return type;
  }

  return type.displayName || type.name || "anonymous";
}

function getDebugLabel(props) {
  return [
    props.id,
    props.name,
    props.group,
    props.label,
    summarizeFillValue(props.children),
  ].filter(Boolean).join("|");
}

function summarizeFillValue(value) {
  if (React.isValidElement(value)) {
    return `[element ${getElementTypeName(value.type)}]`;
  }

  if (Array.isArray(value)) {
    return `[array(${value.length})]`;
  }

  if (typeof value === "function") {
    return `[function ${value.name || "anonymous"}]`;
  }

  if (value && typeof value === "object") {
    return `[object ${Object.keys(value).join(",")}]`;
  }

  return value;
}
