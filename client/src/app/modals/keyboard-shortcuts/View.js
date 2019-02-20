/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { PureComponent } from 'react';

import {
  ModalWrapper
} from '../../primitives';

import css from './View.less';


class View extends PureComponent {
  render() {
    const {
      shortcuts,
      onClose
    } = this.props;

    return (
      <ModalWrapper className={ css.View } onClose={ onClose }>
        <h2>Keyboard Shortcuts</h2>
        <p>
          The following special shortcuts can be used on opened diagrams.
        </p>
        <table>
          <tbody className="keyboard-shortcuts">
            {
              (shortcuts || []).map(s => {
                return <tr key={ s.id }>
                  <td>{ s.label }</td>
                  <td className="binding"><code>{ s.binding }</code></td>
                </tr>;
              })
            }
          </tbody>
        </table>
        <p>
          Find additional shortcuts on individual items in the application menu.
        </p>
      </ModalWrapper>
    );
  }

}

export default View;