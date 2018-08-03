import React, { Component } from "react";

import styled from 'styled-components';

import Slot from "./slot-fill/Slot";

const Container = styled.div`
  padding: 5px;
  border: solid 1px #ddd;
  border-radius: 2px;
  flex: initial;

  > div, button {
    margin-right: 5px;

    &:last-child {
      margin-right: 0;
    }
  }
`;

export default class Buttons extends Component {
  render() {
    return (
      <Container className="buttons">
        <Slot name="buttons" />
      </Container>
    );
  }
}
