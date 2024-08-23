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

export default function RobotOutputTab(props) {
  const {
    layout = {}
  } = props;

  // const [ cachedValues, setCachedValues ] = useState({});
  // const [ isOpen, setIsOpen ] = useState(false);
  // const buttonRef = useRef();

  // console.log(buttonRef);

  // const onClose = () => {
  //   setIsOpen(false);
  // };

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
        <h3>Last run:</h3>
        <Content { ...props } />
      </div>
    </Fill>

    {/* { isOpen &&
    <Overlay
      onClose={ onClose }
      anchor={ buttonRef.current }
    >
      <RunForm
        cachedValues={ cachedValues }
        setCachedValues={ setCachedValues }
        onClose={ onClose }
        { ...props }
      />
    </Overlay> */}
    {/* } */}
  </>;
}


function Content(props) {
  const {
    output,
    isRunning
  } = props;

  console.log(output);

  if (isRunning) {
    return <div className="running">Running...</div>;
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
    <pre>{output.stdOut}</pre>
    <button onClick={ () => setShowReport('log') }>Show Log</button>
    {/* <button onClick={ () => setShowReport('report') }>Show Report</button> */}
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



{/* export function RunButton(props) {
  const [ cachedValues, setCachedValues ] = useState({});
  const [ isOpen, setIsOpen ] = useState(false);
  const buttonRef = useRef();

  const onClose = () => {
    setIsOpen(false);
  };


  return <>
    <button
      ref={ buttonRef }
      onClick={ () => setIsOpen(!isOpen) }
      title="Run robot script"
      className={ classNames('btn', css.DeploymentPlugin, { 'btn--active': isOpen }) }
    >
      <RunIcon className="icon" />
    </button>;

    }
  </>;
} */}