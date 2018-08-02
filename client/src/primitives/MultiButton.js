import styled from 'styled-components';

export const MultiButton = styled.div`
  display: inline-block;

  > button {
    margin: 0;
    border-radius: 0;
    border-left: none;

    &:first-child {
      border-left: solid 1px #ddd;
      border-top-left-radius: 2px;
      border-bottom-left-radius: 2px;
    }

    &:last-child {
      border-top-right-radius: 2px;
      border-bottom-right-radius: 2px;
    }
  }
`;