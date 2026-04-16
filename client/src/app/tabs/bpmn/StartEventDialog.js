/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState, useEffect, useRef } from 'react';

import * as css from './GuidedStart.less';


const START_EVENTS = [
  {
    id: 'form',
    label: 'Via a form',
    description: 'Someone fills in and submits a form to kick things off.',
    icon: <NoneEventIcon />,
    aliases: [ 'form', 'submit', 'fill', 'input' ]
  },
  {
    id: 'manual',
    label: 'Triggered manually',
    description: 'A person or system directly starts this — via API, Operate, or a Call Activity. Also the right choice for reusable subprocesses.',
    icon: <NoneEventIcon />,
    aliases: [ 'manual', 'api', 'call activity', 'subprocess', 'operate', 'direct' ]
  },
  {
    id: 'timer',
    label: 'On a schedule',
    description: 'Runs automatically at regular times — every morning, once a week, or after a delay.',
    icon: <TimerEventIcon />,
    aliases: [ 'schedule', 'time', 'cron', 'timer', 'delay', 'interval', 'daily', 'weekly', 'recurring' ]
  },
  {
    id: 'message',
    label: 'When a message arrives',
    description: 'Starts when another process or system sends a named message — for event-driven and decoupled integrations.',
    icon: <MessageEventIcon />,
    aliases: [ 'message', 'event', 'integration', 'decoupled', 'queue', 'pubsub', 'kafka' ]
  },
  {
    id: 'webhook',
    label: 'When a webhook is received',
    description: 'Starts when an HTTP request hits a webhook URL — for connecting external tools like Slack, GitHub, or custom apps.',
    icon: <MessageEventIcon />,
    aliases: [ 'webhook', 'http', 'rest', 'api', 'slack', 'github', 'external', 'inbound', 'request' ]
  },
  {
    id: 'signal',
    label: 'When a signal is broadcast',
    description: 'Many processes start at once in response to a shared event — for fan-out scenarios.',
    icon: <SignalEventIcon />,
    aliases: [ 'signal', 'broadcast', 'fan-out', 'fanout', 'multiple', 'parallel', 'notify' ]
  }
];


/**
 * Dialog that lets the user choose a start event type.
 *
 * @param {object} props
 * @param {function} props.onSelect - called with the selected event type id
 * @param {function} props.onClose - called when the dialog is dismissed
 */
export default function StartEventDialog({ onSelect, onClose }) {
  const [ query, setQuery ] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    searchRef.current && searchRef.current.focus();
  }, []);

  const filtered = query.trim()
    ? START_EVENTS.filter(({ label, description, aliases }) => {
      const q = query.toLowerCase();
      return (
        label.toLowerCase().includes(q) ||
        description.toLowerCase().includes(q) ||
        aliases.some(a => a.includes(q))
      );
    })
    : START_EVENTS;

  return (
    <>
      <div className={ css.backdrop } onClick={ onClose } />
      <div className={ css.dialog } role="dialog" aria-modal="true" aria-label="Choose start event">
        <h3 className={ css.dialogHeading }>When should this process run?</h3>

        <input
          ref={ searchRef }
          className={ css.searchInput }
          type="search"
          placeholder="Search..."
          value={ query }
          onChange={ e => setQuery(e.target.value) }
        />

        <ul className={ css.eventList } role="listbox">
          { filtered.map(({ id, label, description, icon }) => (
            <li
              key={ id }
              className={ css.eventItem }
              role="option"
              tabIndex={ 0 }
              onClick={ () => onSelect(id) }
              onKeyDown={ e => (e.key === 'Enter' || e.key === ' ') && onSelect(id) }
            >
              <span className={ css.eventIcon }>{ icon }</span>
              <span className={ css.eventText }>
                <span className={ css.eventLabel }>{ label }</span>
                <span className={ css.eventDescription }>{ description }</span>
              </span>
            </li>
          )) }

          { filtered.length === 0 && (
            <li className={ css.noResults }>No matching start event found.</li>
          ) }
        </ul>
      </div>
    </>
  );
}


// --- BPMN event icons (inline SVG, matching bpmn-js visual style) ---

function NoneEventIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="28" height="28">
      <circle cx="18" cy="18" r="15" fill="white" stroke="#393939" strokeWidth="2" />
    </svg>
  );
}

function TimerEventIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="28" height="28">
      <circle cx="18" cy="18" r="15" fill="white" stroke="#393939" strokeWidth="2" />
      <circle cx="18" cy="18" r="10" fill="white" stroke="#393939" strokeWidth="1.5" />
      <line x1="18" y1="18" x2="18" y2="11" stroke="#393939" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="18" x2="23" y2="18" stroke="#393939" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MessageEventIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="28" height="28">
      <circle cx="18" cy="18" r="15" fill="white" stroke="#393939" strokeWidth="2" />
      <rect x="9" y="13" width="18" height="11" fill="white" stroke="#393939" strokeWidth="1.5" />
      <polyline points="9,13 18,20 27,13" fill="none" stroke="#393939" strokeWidth="1.5" strokeLinejoin="miter" />
    </svg>
  );
}

function SignalEventIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="28" height="28">
      <circle cx="18" cy="18" r="15" fill="white" stroke="#393939" strokeWidth="2" />
      <polygon points="18,10 27,27 9,27" fill="#393939" />
    </svg>
  );
}
