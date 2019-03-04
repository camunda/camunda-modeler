/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { PureComponent } from 'react';

import ErrorTab from './ErrorTab';
import MultiSheetTab from './MultiSheetTab';


export function createTab(tabName, providers) {

  class EditorTab extends PureComponent {

    static getDerivedStateFromError(error) {
      return {
        hasError: true
      };
    }

    constructor(props) {
      super(props);

      this.state = {
        hasError: false
      };

      this.tabRef = React.createRef();
    }

    triggerAction(action, options) {
      return this.tabRef.current.triggerAction(action, options);
    }

    componentDidCatch(error, info) {
      this.props.onError(error, info);
    }

    componentDidMount() {
      this.props.onShown();
    }

    render() {
      const {
        tab,
        ...otherProps
      } = this.props;

      return (
        this.state.hasError ?
          <ErrorTab ref={ this.tabRef } /> :
          <MultiSheetTab
            id={ tab.id }
            tab={ tab }
            { ...otherProps }
            xml={ tab.file.contents }
            ref={ this.tabRef }
            providers={ providers } />
      );
    }

  }

  EditorTab.displayName = tabName;

  return EditorTab;
}