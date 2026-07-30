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
} from '../../../shared/ui';

import * as css from './View.css';


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
            The following keyboard and mouse shortcuts are available in the application.
          </p>
          {
            (shortcuts || []).map(group => {
              return <section key={ group.id } className="shortcut-group">
                <h3>{ group.title }</h3>
                <table>
                  <tbody className="keyboard-shortcuts">
                    {
                      group.shortcuts.map(s => {
                        return <tr key={ s.id }>
                          <td>{ s.label }</td>
                          <td className="binding"><code>{ s.binding }</code></td>
                        </tr>;
                      })
                    }
                  </tbody>
                </table>
              </section>;
            })
          }
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
