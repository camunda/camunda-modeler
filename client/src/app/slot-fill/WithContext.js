import React from 'react';

import FillContext from './FillContext';


export default function(Component) {

  return function WithFillContext(props) {

    return (
      <FillContext.Consumer>{
        (fillContext) => {
          return (
            <WithFillContext { ...props } fillContext={ fillContext } />
          );
        }
      }</FillContext.Consumer>
    );
  };

}