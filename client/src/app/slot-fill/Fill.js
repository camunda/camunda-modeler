import React, { Component } from 'react';

import FillContext from './FillContext';


export default class Fill extends Component {

  render() {
    const {
      children,
      name
    } = this.props;

    return (
      <FillContext.Consumer>{
        (context) => {
          return (
            <ActualFill name={ name } context={ context }>
              { children }
            </ActualFill>
          );
        }
      }</FillContext.Consumer>
    );
  }
}


class ActualFill extends Component {

  componentWillUnmount() {
    const {
      context
    } = this.props;

    context.removeFill(this.id);
  }

  componentDidMount() {

    const {
      name,
      children,
      context
    } = this.props;

    this.id = context.addFill(this.id, name, children);
  }

  componentDidUpdate() {

    const {
      name,
      children,
      context
    } = this.props;

    this.id = context.addFill(this.id, name, children);
  }

  render() {
    return null;
  }
}