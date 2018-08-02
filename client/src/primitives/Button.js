import styled, { css } from 'styled-components';

export const Button = styled.button`
  padding: 5px;
  background: white;
  border: solid 1px #ddd;
  border-radius: 2px;
  outline: none;

  &:hover {
    background: #eee;
  }

  ${props => props.primary && css`
    background: #489d12;
    color: white;
    border-color: #489d12;

    &:hover {
      background: #2F8400;
      border-color: #2F8400;
    }
  `}

  ${props => props.disabled && css`
    background: #CCC;

    &:hover,
    &:active {
      background: #CCC;
    }
  `}
`;