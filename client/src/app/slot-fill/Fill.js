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

const SLOT_FILL_DEBUG = process.env.REACT_SLOT_FILL_DEBUG === "true";

export default class Fill extends PureComponent {
  render() {
    const props = this.props;

    return (
      <FillContext.Consumer>
        {(context) => {
          return <ActualFill {...props} fillContext={context} />;
        }}
      </FillContext.Consumer>
    );
  }
}

class ActualFill extends PureComponent {

  _fillId = null;

  componentWillUnmount() {
    this._deregister();
  }

  componentDidMount() {
    this._register();
  }

  componentDidUpdate(previousProps) {
    const changedKeys = getChangedFillPropKeys(previousProps, this.props);

    if (changedKeys.length) {
      if (SLOT_FILL_DEBUG) {
        debugFillUpdate(this._fillId, previousProps, this.props, changedKeys);
      }

      this._register();
    }
  }

  render() {
    return null;
  }

  _deregister() {
    const { fillContext } = this.props;

    fillContext.removeFill(this._fillId);
  }

  _register() {
    const { fillContext, ...props } = this.props;

    this._fillId = fillContext.addFill({
      id: this._fillId,
      props,
    });
  }
}

function haveFillPropsChanged(previousProps, nextProps) {
  const { fillContext: previousFillContext, ...previousFillProps } = previousProps;
  const { fillContext: nextFillContext, ...nextFillProps } = nextProps;

  return havePropsChanged(previousFillProps, nextFillProps);
}

function getChangedFillPropKeys(previousProps, nextProps) {
  const { fillContext: previousFillContext, ...previousFillProps } = previousProps;
  const { fillContext: nextFillContext, ...nextFillProps } = nextProps;

  const keys = new Set([
    ...Object.keys(previousFillProps),
    ...Object.keys(nextFillProps),
  ]);

  return Array.from(keys).filter((key) => previousFillProps[key] !== nextFillProps[key]);
}

function havePropsChanged(previousProps, nextProps) {
  const previousKeys = Object.keys(previousProps);
  const nextKeys = Object.keys(nextProps);

  if (previousKeys.length !== nextKeys.length) {
    return true;
  }

  return previousKeys.some((key) => previousProps[key] !== nextProps[key]);
}

function debugFillUpdate(fillId, previousProps, nextProps, changedKeys) {
  const debugLabel = getDebugLabel(nextProps, previousProps);

  // Only log if something other than children changed, or if it's a new fill
  if (!fillId || changedKeys.some(k => k !== 'children')) {
    console.log(
      `[slot-fill] Fill.componentDidUpdate id=${fillId || "new"} slot=${nextProps.slot || previousProps.slot || "unknown"} label=${debugLabel} changed=${changedKeys.join(",")}`
    );
  }
}

function summarizeFillProps(props) {
  const { fillContext, ...fillProps } = props;

  return Object.keys(fillProps).reduce((summary, key) => {
    summary[key] = summarizeValue(fillProps[key]);

    return summary;
  }, {});
}

function summarizeValue(value) {
  if (React.isValidElement(value)) {
    return `[element ${getElementTypeName(value.type)}]`;
  }

  if (Array.isArray(value)) {
    return `[array(${value.length}) ${value.map(summarizeValue).join(", ")}]`;
  }

  if (typeof value === "function") {
    return `[function ${value.name || "anonymous"}]`;
  }

  if (value && typeof value === "object") {
    return `[object ${Object.keys(value).join(",")}]`;
  }

  return value;
}

function getElementTypeName(type) {
  if (typeof type === "string") {
    return type;
  }

  return type.displayName || type.name || "anonymous";
}

function getDebugLabel(nextProps, previousProps) {
  const props = nextProps.slot ? nextProps : previousProps;

  return [
    props.id,
    props.name,
    props.group,
    props.label,
    summarizeValue(props.children),
  ].filter(Boolean).join("|");
}
