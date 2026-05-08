/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Kbd,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@camunda/design-system';


export default function View({ shortcuts, onClose }) {
  return (
    <Dialog open onOpenChange={ (open) => { if (!open) onClose(); } }>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            The following special shortcuts can be used on opened diagrams.
          </DialogDescription>
        </DialogHeader>

        <Table>
          <TableBody>
            {
              (shortcuts || []).map(s => (
                <TableRow key={ s.id }>
                  <TableCell>{ s.label }</TableCell>
                  <TableCell className="text-right">
                    <Kbd>{ s.binding }</Kbd>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>

        <p className="text-sm text-muted-foreground">
          Find additional shortcuts on individual items in the application menu.
        </p>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
