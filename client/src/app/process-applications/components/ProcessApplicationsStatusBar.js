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
      <button className={ "btn " + css.ProcessApplicationsButton } ref={ ref } onClick={ () => setIsOpen(!isOpen) } title="This file is part of a process application">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" width="16" height="16"><path fill="#000" d="m6.387 2.824-1.735-1.73H1.015V11.24h2.323q.087.522.25 1.015H1.016A1.015 1.015 0 0 1 0 11.24V1.094A1.015 1.015 0 0 1 1.015.079h3.637a1.01 1.01 0 0 1 .72.3l1.73 1.73h6.088a1.015 1.015 0 0 1 1.015 1.014v1.6a7 7 0 0 0-1.015-.636v-.964H6.681z"></path><path fill="#000" d="m11.959 10.57-2.007 1.661a.586.586 0 0 1-.957-.445V8.464a.58.58 0 0 1 .336-.525.59.59 0 0 1 .62.08l2.008 1.66a.58.58 0 0 1 .155.692.6.6 0 0 1-.155.2"></path><path fill="#000" fill-rule="evenodd" d="M10.766 15.891a.284.284 0 0 0 .248-.234l.151-.868a.3.3 0 0 1 .222-.237c.372-.1.73-.246 1.065-.435a.31.31 0 0 1 .32.01l.727.508a.285.285 0 0 0 .341-.009q.472-.38.855-.848a.28.28 0 0 0 .009-.34l-.51-.717a.3.3 0 0 1-.012-.322q.286-.502.438-1.057a.3.3 0 0 1 .237-.22l.002-.001.874-.15a.28.28 0 0 0 .236-.246q.02-.203.028-.411v-.04q.011-.375-.028-.75a.28.28 0 0 0-.236-.245l-.888-.152a.3.3 0 0 1-.238-.218 4.5 4.5 0 0 0-.44-1.034.3.3 0 0 1 .012-.325l.525-.739a.28.28 0 0 0-.009-.339 6 6 0 0 0-.855-.848.284.284 0 0 0-.341-.01l-.76.534a.3.3 0 0 1-.323.013 4.6 4.6 0 0 0-1.02-.412.3.3 0 0 1-.222-.238l-.16-.918a.28.28 0 0 0-.248-.234 6 6 0 0 0-.59-.031h-.014q-.303 0-.604.03a.28.28 0 0 0-.248.235l-.155.89a.3.3 0 0 1-.223.238c-.365.098-.717.24-1.047.424a.31.31 0 0 1-.319-.01l-.74-.52a.284.284 0 0 0-.342.008 6 6 0 0 0-.855.85.28.28 0 0 0-.009.339l.512.72a.3.3 0 0 1 .011.324q-.288.5-.442 1.055a.3.3 0 0 1-.24.22l-.87.149a.28.28 0 0 0-.236.245q-.062.601 0 1.201c.014.125.111.224.236.246l.87.149a.3.3 0 0 1 .24.219c.1.365.249.72.442 1.055a.3.3 0 0 1-.011.325l-.512.72a.28.28 0 0 0 .01.338q.382.469.854.85c.098.079.238.08.341.008l.74-.519a.3.3 0 0 1 .32-.011q.252.14.517.247.26.109.535.186c.111.031.197.12.219.23l.154.89a.28.28 0 0 0 .248.233q.604.06 1.208 0m-.604-2.288c.929 0 1.82-.366 2.477-1.019a3.47 3.47 0 0 0 1.026-2.46c0-.922-.37-1.806-1.026-2.459a3.52 3.52 0 0 0-2.477-1.018c-.929 0-1.82.366-2.477 1.018a3.47 3.47 0 0 0-1.026 2.46c0 .922.37 1.807 1.026 2.46a3.52 3.52 0 0 0 2.477 1.018" clip-rule="evenodd"></path></svg>
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
