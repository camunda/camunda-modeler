/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useRef, useState } from 'react';

import { Fill } from '../../slot-fill';

import { Overlay, Section } from '../../../shared/ui';

export default function ProcessApplicationStatusBar(props) {
  const ref = useRef();

  const [ isOpen, setIsOpen ] = useState(false);

  const { processApplication } = props;

  if (!processApplication) {
    return null;
  }

  return <>
    <Fill slot="status-bar__file" group="0_process-application">
      <button className="btn" ref={ ref } onClick={ () => setIsOpen(!isOpen) }>
        { processApplication.name || 'Process application' }
      </button>
    </Fill>
    {
      isOpen && <Overlay id="process-application-overlay" anchor={ ref.current }>
        <Section>
          <Section.Header>
            Files
          </Section.Header>
          <Section.Body>
            <ul className="dashed">
              {
                processApplication.files.map(file => {
                  return <li key={ file.path } title={ file.path }>{ file.name }</li>;
                })
              }
            </ul>
          </Section.Body>
        </Section>
      </Overlay>
    }
  </>;
}
