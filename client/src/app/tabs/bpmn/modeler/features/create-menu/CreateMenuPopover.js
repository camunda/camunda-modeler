/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Popover,
  PopoverContent,
  PopoverAnchor
} from '@camunda/design-system';


export default function CreateMenuPopover({ eventBus, popupMenu, canvas }) {
  const [ open, setOpen ] = useState(false);
  const [ groups, setGroups ] = useState({});
  const [ activeGroup, setActiveGroup ] = useState(null);
  const [ position, setPosition ] = useState({ x: 0, y: 0 });
  const anchorRef = useRef(null);
  const listRef = useRef(null);

  const handleOpen = useCallback((event) => {
    const { anchor } = event;
    setPosition(anchor);

    const rootElement = canvas.getRootElement();

    const providers = popupMenu._getProviders('bpmn-create');
    const rawEntries = popupMenu._getEntries(rootElement, providers);

    // Group entries
    const grouped = {};
    Object.entries(rawEntries).forEach(([ id, entry ]) => {
      const groupId = entry.group?.id || 'other';
      const groupName = entry.group?.name || 'Other';
      if (!grouped[groupId]) {
        grouped[groupId] = { name: groupName, entries: [] };
      }
      grouped[groupId].entries.push({ id, ...entry });
    });

    // Sort entries within groups
    Object.values(grouped).forEach(group => {
      group.entries.sort((a, b) => (b.rank || 0) - (a.rank || 0));
    });

    setGroups(grouped);
    setActiveGroup(null);
    setOpen(true);
  }, [ popupMenu, canvas ]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setActiveGroup(null);
  }, []);

  useEffect(() => {
    eventBus.on('createMenu.open', handleOpen);

    return () => {
      eventBus.off('createMenu.open', handleOpen);
    };
  }, [ eventBus, handleOpen ]);

  const onSelect = useCallback((entry) => {
    setOpen(false);
    setActiveGroup(null);

    if (entry.action && entry.action.click) {
      entry.action.click(new MouseEvent('click'));
    }
  }, []);

  const onKeyDown = useCallback((event) => {
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
    } else if (key === 'ArrowLeft' && activeGroup) {
      event.preventDefault();
      setActiveGroup(null);
    } else if (key === 'Escape') {
      event.preventDefault();
      if (activeGroup) {
        setActiveGroup(null);
      } else {
        handleClose();
      }
    }
  }, [ activeGroup, handleClose ]);

  // Focus first item when list renders
  const focusFirst = useCallback((el) => {
    if (el) {
      requestAnimationFrame(() => {
        el.querySelector('button')?.focus();
      });
    }
  }, []);

  const currentEntries = activeGroup ? groups[activeGroup]?.entries || [] : null;

  return (
    <Popover open={ open } onOpenChange={ (isOpen) => { if (!isOpen) handleClose(); } }>
      <PopoverAnchor asChild>
        <div
          ref={ anchorRef }
          style={ {
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: 0,
            height: 0,
            pointerEvents: 'none'
          } }
        />
      </PopoverAnchor>
      <PopoverContent
        side="right"
        align="start"
        className="w-[240px] max-h-[400px] overflow-y-auto p-1"
        onOpenAutoFocus={ (e) => e.preventDefault() }
      >
        { !activeGroup ? (
          <ul
            role="menu"
            style={ { listStyle: 'none', margin: 0, padding: 0 } }
            ref={ focusFirst }
          >
            {
              Object.entries(groups).map(([ groupId, group ]) => (
                <li key={ groupId } role="menuitem">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={ () => setActiveGroup(groupId) }
                    onKeyDown={ (e) => {
                      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGroup(groupId);
                      } else {
                        onKeyDown(e);
                      }
                    } }
                  >
                    <span>{ group.name }</span>
                    <span style={ { opacity: 0.5 } }>›</span>
                  </button>
                </li>
              ))
            }
          </ul>
        ) : (
          <div>
            <button
              type="button"
              className="flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              onClick={ () => setActiveGroup(null) }
            >
              <span>‹</span>
              <span>{ groups[activeGroup].name }</span>
            </button>
            <ul
              role="menu"
              style={ { listStyle: 'none', margin: 0, padding: 0 } }
              ref={ focusFirst }
            >
              {
                currentEntries.map(entry => (
                  <li key={ entry.id } role="menuitem">
                    <button
                      type="button"
                      title={ entry.label }
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={ () => onSelect(entry) }
                      onKeyDown={ onKeyDown }
                    >
                      { entry.className && (
                        <span className={ entry.className } style={ { width: 16, height: 16, flexShrink: 0 } } />
                      ) }
                      <span>{ entry.label }</span>
                    </button>
                  </li>
                ))
              }
            </ul>
          </div>
        ) }
      </PopoverContent>
    </Popover>
  );
}
