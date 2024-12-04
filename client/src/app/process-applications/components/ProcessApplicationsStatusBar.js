/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect, useRef, useState } from 'react';

import { Fill } from '../../slot-fill';

import { Overlay, Section } from '../../../shared/ui';

import * as css from './ProcessApplicationsStatusBar.less';

export default function ProcessApplicationsStatusBar(props) {
  const ref = useRef();

  const [ isOpen, setIsOpen ] = useState(false);

  const {
    onOpen,
    processApplication
  } = props;

  useEffect(() => {
    if (!processApplication) {
      setIsOpen(false);
    }
  }, [ processApplication ]);

  if (!processApplication) {
    return null;
  }

  const { items } = processApplication;

  return <>
    <Fill slot="status-bar__file" group="0_process-application">
      <button className="btn" ref={ ref } onClick={ () => setIsOpen(!isOpen) }>
        { processApplication.name || 'Process application' }
      </button>
    </Fill>
    {
      isOpen && <Overlay className={ css.ProcessApplicationsOverlay } id="process-application-overlay" anchor={ ref.current } onClose={ () => setIsOpen(false) }>
        <Section>
          <Section.Header>
            Process application
          </Section.Header>
          <Section.Body>
            {
              items.filter(item => item.metadata.type === 'bpmn').length > 0 && <>
                <p>BPMN</p>
                <ul className="dashed">
                  {
                    items.filter(item => item.metadata.type === 'bpmn').map(item => {
                      const { file } = item;

                      return <li className="link" onClick={ () => onOpen(file.path) } key={ file.path } title={ file.path }>{ file.name }</li>;
                    })
                  }
                </ul>
              </>
            }
            {
              items.filter(item => item.metadata.type === 'dmn').length > 0 && <>
                <p>DMN</p>
                <ul className="dashed">
                  {
                    items.filter(item => item.metadata.type === 'dmn').map(item => {
                      const { file } = item;

                      return <li className="link" onClick={ () => onOpen(file.path) } key={ file.path } title={ file.path }>{ file.name }</li>;
                    })
                  }
                </ul>
              </>
            }
            {
              items.filter(item => item.metadata.type === 'form').length > 0 && <>
                <p>Form</p>
                <ul className="dashed">
                  {
                    items.filter(item => item.metadata.type === 'form').map(item => {
                      const { file } = item;

                      return <li className="link" onClick={ () => onOpen(file.path) } key={ file.path } title={ file.path }>{ file.name }</li>;
                    })
                  }
                </ul>
              </>
            }
          </Section.Body>
        </Section>
      </Overlay>
    }
  </>;
}
