/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState } from 'react';
import { Fill } from '../../../../slot-fill';
import { Modal } from '../../../../../shared/ui';

import { RunButton } from './RunButton';

import './RobotOutputTab.less';
import { Button, CodeSnippet, CodeSnippetSkeleton, Column, FlexGrid, Grid, Heading, Row, Section, Tile } from '@carbon/react';

import './carbon.scss';

export default function RobotOutputTab(props) {
  const {
    layout = {}
  } = props;

  return <>
    <Fill slot="bottom-panel"
      id="robot-output"
      label="Robot Testing"
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
      <Section className="robotOutput" style={ { height: '100%', padding: '10px' } }>
        <Section>
          <Content { ...props } />
        </Section>
      </Section>
    </Fill>

  </>;
}


function Content(props) {
  const {
    output,
    isRunning
  } = props;

  if (isRunning) {
    return <RobotReport output={ {} } />;
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

  console.log(output);

  return <Grid condensed={ true }>
    <Column sm="75%" md="75%" lg="75%">
      <Tile>
        <Heading>Output</Heading>
        {output.stdOut ? <CodeSnippet type="multi">{output.stdOut}</CodeSnippet> : <CodeSnippetSkeleton type="multi" />}
        {output.log && <Button onClick={ () => setShowReport('log') }>Show Log</Button>}
        {showReport && <Report content={ output.log } onClose={ () => setShowReport(false) } />}
      </Tile>
    </Column>
    <Column sm="25%" md="25%" lg="25%">
      <Tile>
        <Heading>Variables</Heading>
        {output.variables ? <CodeSnippet type="multi">{JSON.stringify(output.variables, null, 2)}</CodeSnippet> : <CodeSnippetSkeleton type="multi" />}
      </Tile>
    </Column>
  </Grid> ;
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
