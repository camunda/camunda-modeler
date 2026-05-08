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
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@camunda/design-system';

import { Fill } from '../../app/slot-fill';

import PlusIcon from '../../../resources/icons/Plus.svg';


export class CreateNewAction extends PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      open: false
    };
  }

  componentDidMount() {
    const {
      subscribe
    } = this.props;

    subscribe('createNewAction.open', () => {
      this.open();
    });
  }

  open() {
    this.setState({ open: true });
  }

  onClose = () => {
    this.setState({ open: false });
  };

  onSelect = (item) => {
    item.onClick();
    this.onClose();
  };

  onItemKeyDown = (event) => {
    const { key, currentTarget } = event;
    const li = currentTarget.closest('li');

    if (key === 'ArrowDown') {
      event.preventDefault();
      const next = li.nextElementSibling || li.parentElement.firstElementChild;
      next?.querySelector('button')?.focus();
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      const prev = li.previousElementSibling || li.parentElement.lastElementChild;
      prev?.querySelector('button')?.focus();
    }
  };

  render() {
    const {
      newFileItems = []
    } = this.props;

    const {
      open
    } = this.state;

    return (
      <Popover open={ open } onOpenChange={ (isOpen) => { if (!isOpen) this.onClose(); } }>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="btn--tab-action"
            title="Create new ..."
            onClick={ () => this.setState({ open: !open }) }
          >
            <PlusIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-auto min-w-[160px] p-1"
          onOpenAutoFocus={ (e) => e.preventDefault() }
        >
          <ul role="menu" style={ { listStyle: 'none', margin: 0, padding: 0 } } ref={ (el) => {
            if (el) {
              requestAnimationFrame(() => {
                el.querySelector('button')?.focus();
              });
            }
          } }>
            {
              newFileItems.flatMap((group) =>
                group.items.map((item, index) => (
                  <li key={ `${group.key}-${index}` } role="menuitem">
                    <button
                      type="button"
                      title={ item.text }
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0"
                      onClick={ () => this.onSelect(item) }
                      onKeyDown={ this.onItemKeyDown }
                    >
                      { item.icon && <item.icon /> }
                      { item.text }
                    </button>
                  </li>
                ))
              )
            }
          </ul>
        </PopoverContent>
      </Popover>
    );
  }
}

export function CreateNewActionPlugin(props) {
  const {
    _getFromApp
  } = props;

  const newFileItems = _getFromApp('_getNewFileItems')();

  return (
    <Fill slot="tab-trailing" priority={ 2 }>
      <CreateNewAction newFileItems={ newFileItems } { ...props } />
    </Fill>
  );
}
