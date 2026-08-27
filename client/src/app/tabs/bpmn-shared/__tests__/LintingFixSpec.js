/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { expect } from 'chai';
import { spy } from 'sinon';

import {
  applyLintingFix,
  resolveLintingFix
} from '../LintingFix';

describe('LintingFix', function() {

  it('should expose shared fix presentation metadata', function() {

    // given
    const { modeler, report } = createScenario('=fromAi(42)');

    // when
    const resolvedFix = resolveLintingFix(modeler, report);

    // then
    expect(resolvedFix).to.include({
      label: 'Input from agent',
      kind: 'autofill'
    });
    expect(resolvedFix.ariaLabel).to.match(/^Input from agent: /);
    expect(resolvedFix.tooltip).to.be.a('string').and.not.be.empty;
  });


  it('should apply shared commands as one undo unit', function() {

    // given
    const { commandStack, linting, modeler, report } = createScenario('=fromAi(url)');

    // when
    applyLintingFix(modeler, report);

    // then
    expect(linting.showError).to.have.been.calledOnceWith(report);
    expect(commandStack.execute).to.have.been.calledOnce;

    const [ command, commands ] = commandStack.execute.firstCall.args;

    expect(command).to.equal('properties-panel.multi-command-executor');
    expect(commands).to.have.length(1);
    expect(commands[ 0 ]).to.deep.include({
      cmd: 'element.updateModdleProperties'
    });
  });


  it('should do nothing when a report has become stale', function() {

    // given
    const { commandStack, linting, modeler, report } = createScenario('=fromAi(toolCall.url)');

    // when
    applyLintingFix(modeler, report);

    // then
    expect(linting.showError).not.to.have.been.called;
    expect(commandStack.execute).not.to.have.been.called;
  });

});

function createScenario(source) {
  const moddleElement = {
    source,
    target: 'url',
    get(property) {
      return this[ property ];
    }
  };

  const element = {
    businessObject: moddleElement
  };

  const report = {
    id: 'Task_1',
    path: [ 'source' ],
    data: {
      fix: {
        kind: 'fix'
      }
    }
  };

  const commandStack = {
    execute: spy()
  };

  const linting = {
    showError: spy()
  };

  const services = {
    commandStack,
    elementRegistry: {
      get: () => element
    },
    linting
  };

  const modeler = {
    get: service => services[ service ]
  };

  return {
    commandStack,
    linting,
    modeler,
    report
  };
}
