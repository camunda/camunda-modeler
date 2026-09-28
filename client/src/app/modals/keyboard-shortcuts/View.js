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
  Button,
  Heading,
  InlineCode,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@camunda/design-system';

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
                <Heading as="h3" variant="heading-xs">{ group.title }</Heading>
                <Table size="sm">
                  <TableBody className="keyboard-shortcuts">
                    {
                      group.shortcuts.map(s => {
                        return <TableRow key={ s.id }>
                          <TableCell>{ s.label }</TableCell>
                          <TableCell className="binding"><InlineCode>{ s.binding }</InlineCode></TableCell>
                        </TableRow>;
                      })
                    }
                  </TableBody>
                </Table>
              </section>;
            })
          }
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={ onClose }>Close</Button>
        </Modal.Footer>
      </Modal>
    );
  }

}

export default View;
