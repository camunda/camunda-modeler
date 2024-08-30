/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useMemo, useState } from 'react';
import { Fill } from '../../../../slot-fill';
import { Modal } from '../../../../../shared/ui';

import './RobotOutputTab.less';
import { Button, CodeSnippet, CodeSnippetSkeleton, Column, Grid, Heading, Layer, Section, Stack, TextInput, Tile, Form, TextArea, FlexGrid } from '@carbon/react';

import './carbon.scss';
import { useLocalState } from '../useLocalState';
import { runFile } from '../Deployment/API';
import useAsyncMemo from '../useAsyncMemo';

export default function RobotOutputTab(props) {
  const {
    layout = {},
    id
  } = props;

  const [ output, setOutput ] = useLocalState(id + 'output', '');
  const [ isRunning, setIsRunning ] = useState(false);


  return <>
    <Fill slot="bottom-panel"
      id="robot-output"
      label="Robot Testing"
      layout={ layout }
      priority={ 15 }
    >
      <Section className="robotOutput" style={ { height: '100%', padding: '10px' } }>
        <Section>
          <Grid fullWidth={ true }>
            <Column span={ 4 }>
              <Tile>
                <Layer>
                  <CarbonRunForm { ...props } setOutput={ setOutput } isRunning={ isRunning } setIsRunning={ setIsRunning } />
                </Layer>
              </Tile>
            </Column>
            <Column span={ 12 }>
              <Content { ...props } output={ output } isRunning={ isRunning } />
            </Column>
          </Grid>
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

  console.log('isRunning', isRunning);

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

  return <Grid condensed={ true }>
    <Column lg={ 8 } md={ 4 } sm={ 4 }>
      <Tile>
        {/* <Stack gap={ 3 }> */}
        <Heading>Output</Heading>
        {output.stdOut ?
          <code type="multi" className="text-mono"><pre style={ { overflow: 'auto', userSelect: 'text' } }>{output.stdOut}</pre></code> :
          <CodeSnippetSkeleton type="multi" />}
        {output.log && <Button onClick={ () => setShowReport('log') }>Show Log</Button>}
        {showReport && <Report content={ output.log } onClose={ () => setShowReport(false) } />}
        {/* </Stack> */}
      </Tile>
    </Column>
    <Column lg={ 4 } md={ 4 } sm={ 4 }>
      <Tile>
        {/* <Stack  gap={ 3 }> */}
        <Heading>Variables</Heading>
        {output.variables ? <CodeSnippet type="multi">{JSON.stringify(output.variables, null, 2)}</CodeSnippet> : <CodeSnippetSkeleton type="multi" />}
        {/* </Stack> */}
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


function CarbonRunForm(props) {

  const {
    getValue,
    name,
    setIsRunning,
    isRunning,
    setOutput,
    id
  } = props;

  const [ values, setValues ] = useLocalState(id + 'robotTab', {
    'name': name?.split('.')?.[0],
    'endpoint': 'http://localhost:36227/',
    'variables': ''
  });

  const onSubmit = async (...rest) => {
    setIsRunning(true);
    const response = await runFile({
      ...values,
      script: getValue()
    });
    setIsRunning(false);
    setOutput(response);
  };

  const jsonValid = useMemo(() => {
    const value = values.variables;
    if (value && value.trim().length > 0) {
      try {
        JSON.parse(value);
      } catch (e) {
        return true;
      }
      return false;
    }
  }, [ values.variables ]);

  const endpointValid = useAsyncMemo(() => {
    return validateEndpointURL(values.endpoint);
  }, [ values.endpoint ], false);

  return <Form>
    <Stack gap={ 3 }>
      <TextInput
        id="ScriptName"
        labelText="Script Name"
        value={ values.name }
        onChange={ e => setValues({ ...values, name: e.target.value }) }
      />
      <TextInput
        id="endpoint"
        labelText="Endpoint URL"
        value={ values.endpoint }
        onChange={ e => setValues({ ...values, endpoint: e.target.value }) }
        invalidText="Could not connect to RPA runtine. Make sure the RPA runtime is running."
        invalid={ !!endpointValid }
      />
      <TextArea
        rows="3"
        id="variables"
        labelText="Variables"
        placeholder="A JSON string representing the variables the script will be called with"
        helperText={ <span>Must be a proper <a href="https://www.w3schools.com/js/js_json_intro.asp">JSON string</a> representing <a href="https://docs.camunda.io/docs/components/concepts/variables/?utm_source=modeler&utm_medium=referral">Zeebe variables</a>.</span> }
        value={ values.variables }
        onChange={ e => setValues({ ...values, variables: e.target.value }) }
        invalidText="Variables is not valid JSON"
        invalid={ !!jsonValid }
      />
      <Button onClick={ onSubmit } disabled={ isRunning }>Run Script</Button>
    </Stack>
  </Form>;
}


const validateEndpointURL = async (value) => {
  try {
    const response = await fetch(value + 'status');
    console.log(response);
  } catch (error) {
    console.error(error);
    return 'Could not connect to RPA runtine. Make sure the RPA runtime is running.';
  }
};
