/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useEffect } from 'react';

import { is } from 'bpmn-js/lib/util/ModelUtil';

import Test from './Test';

import { Fill } from '../../../slot-fill';

import * as css from './TestTab.less';

import TestStatusBarItem from './TestStatusBarItem';
import classNames from 'classnames';

export default function TestTab(props) {
  const {
    injector,
    layout = {},
    onAction,
    backend,
    config,
    file
  } = props;

  const [ input, setInput ] = React.useState('');
  const [ loading, setLoading ] = React.useState(false);
  const [ selectedElement, setSelectedElement ] = React.useState(null);
  const [ test, setTest ] = React.useState(null);
  const [ testResults, setTestResults ] = React.useState({});

  useEffect(() => {
    const _test = new Test(backend, config, injector, file);

    setTest(_test);

    _test.getInput().then((input) => {
      setInput(input);
    });
  }, []);

  useEffect(() => {
    injector.get('eventBus').on('selection.changed', ({ newSelection }) => {
      if (newSelection.length === 1 && is(newSelection[0], 'bpmn:Task')) {
        setSelectedElement(newSelection[0]);
      } else {
        setSelectedElement(null);
      }
    });
  }, []);

  useEffect(() => {
    const callback = ({ element }) => {
      if (testResults[element.id]) {
        setTestResults({
          ...testResults,
          [ element.id ]: null
        });
      }
    };

    injector.get('eventBus').on('element.changed', callback);

    return () => {
      injector.get('eventBus').off('element.changed', callback);
    };
  }, [ testResults ]);

  useEffect(() => {

    // get input for selected element from local storage
    if (selectedElement) {
      const storedInput = localStorage.getItem(`test-input-${selectedElement.id}`);
      if (storedInput) {
        setInput(storedInput);
      }
    }
  }, [ selectedElement ]);

  useEffect(() => {

    // set input for selected element in local storage
    if (selectedElement && input) {
      localStorage.setItem(`test-input-${selectedElement.id}`, input);
    }
  }, [ input ]);

  const onToggle = () => {
    const { panel = {} } = layout;

    if (!panel.open || panel.tab !== 'test') {
      onAction('open-panel', { tab: 'test' });
    } else if (panel.tab === 'test') {
      onAction('close-panel');
    }
  };

  const onTest = async () => {
    if (!test) {
      return;
    }

    setLoading(true);

    onAction('save');

    setTestResults({
      ...testResults,
      [ selectedElement.id ]: null
    });

    const results = await test.run(selectedElement.id, input, (getProcessInstanceResult) => {
      if (getProcessInstanceResult.success) {
        setTestResults({
          ...testResults,
          [ selectedElement.id ]: getProcessInstanceResult
        });
      } else {
        setTestResults({
          ...testResults,
          [ selectedElement.id ]: getProcessInstanceResult
        });
      }
    });

    console.log('test results', results);

    setTestResults({
      ...testResults,
      [ selectedElement.id ]: results
    });

    setLoading(false);
  };

  console.log('test results', testResults);

  return <>
    <Fill slot="bottom-panel"
      id="test"
      label="Test"
      layout={ layout }
      priority={ 10 }>
      <div className={ css.TestTab }>
        {
          !selectedElement && <div className="placeholder">Select a task to test.</div>
        }
        {
          selectedElement !== null && (
            <>
              {/* <div className="header">
                <h5>Test { getBusinessObject(selectedElement).name }</h5>
              </div> */}
              <div className="input-output">
                <div className="input">
                  <div className="input-header">
                    <h5>Input</h5>
                    <button className={
                      classNames('btn', {
                        'btn-primary': !testResults[selectedElement.id],
                        'btn-secondary': testResults[selectedElement.id]
                      })
                    } onClick={ onTest } disabled={ loading }>{ loading ? 'Running...' : testResults[selectedElement.id] ? 'Run' : 'Run' }</button>
                  </div>
                  <div className="input-content">
                    <textarea spellCheck="false" rows="10" onChange={ (e) => setInput(e.target.value) } value={ input }></textarea>
                  </div>
                </div>
                <div className="output">
                  <div className="output-header">
                    <h5>Output</h5>
                    <button className="btn btn-secondary">Save as example output data</button>
                  </div>
                  <div className="output-content">
                    {
                      testResults[selectedElement.id] && (
                        <>
                          {
                            testResults[selectedElement.id].type === 'instanceStarted' && <span>Instance started...</span>
                          }
                          {
                            testResults[selectedElement.id].type === 'instanceNotFound' && <span>Waiting for Operate 😴...</span>
                          }
                          {
                            testResults[selectedElement.id].type === 'instanceFound' && (
                              <pre>{ JSON.stringify(testResults[selectedElement.id].response.response.variables, null, 2) }</pre>
                            )
                          }
                        </>
                      )
                    }
                  </div>
                </div>
              </div>
            </>
          )
        }
      </div>
    </Fill>
    <TestStatusBarItem
      layout={ layout }
      onToggle={ onToggle } />
  </>;
}