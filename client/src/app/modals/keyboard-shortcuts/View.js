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

import {
  Modal
} from '../../primitives';

import css from './View.less';


class View extends PureComponent {
  render() {
    const {
      shortcuts,
      onClose
    } = this.props;

    return (
      <Modal className={ css.View } onClose={ onClose }>

        <Modal.Title>Keyboard Shortcuts</Modal.Title>

        <Modal.Body>
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
        </Modal.Body>

        <Modal.Footer>
          <div className="buttonDiv">
            <button className="btn btn-primary" onClick={ onClose }>Close</button>
          </div>
        </Modal.Footer>
      </Modal>
    );
  }

}

export default View;
