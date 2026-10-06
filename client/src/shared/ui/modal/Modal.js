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

import classNames from 'classnames';

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@camunda/design-system';

import { X } from '@camunda/design-system/icons';

import { KeyboardInteractionTrap } from '../trap';

import * as css from './Modal.css';


/**
 * Modal dialog, exposed to plugins via `global.components`; keep the props and
 * subcomponents stable.
 *
 * @param {Object} props
 * @param {React.ReactNode} [props.children]
 * @param {string} [props.className]
 * @param {Function} [props.onClose] - closable via Escape and the close button when set
 * @param {boolean} [props.adaptive] - wide dialog for large content
 */
export default function Modal(props) {
  const {
    adaptive,
    children,
    className,
    onClose
  } = props;

  const handleOpenChange = (open) => {
    if (!open && onClose) {
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={ handleOpenChange }>
      <DialogContent
        className={ classNames(css.Modal, className) }
        size={ adaptive ? 'lg' : 'md' }
        showCloseButton={ !!onClose }
        closeLabel="Close"
        aria-describedby={ undefined }
        onEscapeKeyDown={ event => !onClose && event.preventDefault() }
        onInteractOutside={ event => event.preventDefault() }
      >
        <KeyboardInteractionTrap>
          { children }
        </KeyboardInteractionTrap>
      </DialogContent>
    </Dialog>
  );
}

Modal.Body = Body;

Modal.Title = Title;

Modal.Close = Close;

Modal.Footer = Footer;


function Title(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <DialogHeader className={ className } { ...rest }>
      <DialogTitle>
        { children }
      </DialogTitle>
    </DialogHeader>
  );
}

function Close(props) {
  const {
    onClick
  } = props;

  return (
    <Button variant="ghost" size="icon-sm" onClick={ onClick } aria-label="Close">
      <X aria-hidden="true" />
    </Button>
  );
}

function Body(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <DialogBody className={ className } { ...rest }>
      { children }
    </DialogBody>
  );
}

function Footer(props) {
  const {
    children,
    className,
    ...rest
  } = props;

  return (
    <DialogFooter className={ className } { ...rest }>
      { children }
    </DialogFooter>
  );
}
