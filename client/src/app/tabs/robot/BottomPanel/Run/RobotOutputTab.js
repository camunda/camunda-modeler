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
import { Fill } from '../../../../slot-fill';
import { Modal, Overlay } from '../../../../../shared/ui';

import { RunButton } from './RunButton';
import RunIcon from 'icons/Play.svg';
import RunForm from './RunForm';

import './RobotOutputTab.less';
import { CodeSnippet, Heading, InlineLoading, Section } from '@carbon/react';

import './carbon.scss';

export default function RobotOutputTab(props) {
  const {
    layout = {}
  } = props;

  return <>
    <Fill slot="bottom-panel"
      id="robot-output"
      label="Robot Output"
      layout={ layout }
      priority={ 15 }
      actions={ [
        {
          icon: () => <RunButton { ...props } />,
          title: 'Run robot script',
          onClick: () => {},
        }
      ]
      }
    >
      <div>
        <Section>
          <Heading>Script Testing</Heading>
          <Section>
            <Content { ...props } />
          </Section>
        </Section>
      </div>
    </Fill>

  </>;
}


function Content(props) {
  const {
    output,
    isRunning
  } = props;

  console.log(output);

  if (isRunning) {
    return <InlineLoading description="Script is executing..." />;
  }
  else if (!output) {
    return <div className="empty">Run a script to see the Output here.</div>;
  }
  else {
    return <RobotReport output={ output } />;
  }
}


function RobotReport(props) {
  const {
    output
  } = props;

  const [ showReport, setShowReport ] = useState(false);

  return <div className="output">
    <Heading>Output:</Heading>
    <CodeSnippet type="multi">{output.stdOut}</CodeSnippet>
    <button onClick={ () => setShowReport('log') }>Show Log</button>
    <Heading>Variables:</Heading>
    <CodeSnippet>{JSON.stringify(output.variables, null, 2)}</CodeSnippet>
    {showReport && <Report content={ output[showReport] } onClose={ () => setShowReport(false) } />}
  </div>;
}

function Report(props) {
  const {
    onClose,
    content
  } = props;

  return (
    <Modal onClose={ onClose } className="robotOutput">

      <Modal.Body>
        <iframe srcDoc={ content } style={ {
          width: '100%',
          height: '70vh',
        } }></iframe>
      </Modal.Body>

      <Modal.Footer>
        <div className="buttonDiv">
          <button className="btn btn-primary" onClick={ onClose }>Close</button>
        </div>
      </Modal.Footer>
    </Modal>
  );

}
