import { expect } from 'chai';

import { CopilotPlayer } from '../CopilotPlayer';

const stubScenario = {
  id: 'stub',
  chip: { label: 'stub', prompt: 'stub' },
  steps: [
    { type: 'element', elementId: 'e1', bpmnType: 'bpmn:StartEvent', name: 'A', narration: 'na', rationale: 'ra', durationMs: 10 },
    { type: 'element', elementId: 'e2', bpmnType: 'bpmn:EndEvent', name: 'B', narration: 'nb', rationale: 'rb', durationMs: 10 }
  ],
  resultXml: '<?xml version="1.0"?><bpmn:definitions xmlns:bpmn="x"><bpmn:process id="p"><bpmn:startEvent id="e1"/><bpmn:endEvent id="e2"/></bpmn:process></bpmn:definitions>'
};

describe('CopilotPlayer', () => {

  it('emits step events in order and completes', async () => {
    const player = new CopilotPlayer(stubScenario);
    const stepEvents = [];
    const completions = [];
    player.on('step', step => stepEvents.push(step.elementId));
    player.on('complete', () => completions.push(true));

    await player.start();

    expect(stepEvents).to.deep.equal([ 'e1', 'e2' ]);
    expect(completions).to.have.length(1);
    expect(player.isRunning()).to.be.false;
  });

  it('stop halts playback and does not emit further steps', async () => {
    const player = new CopilotPlayer(stubScenario);
    const stepEvents = [];
    player.on('step', step => stepEvents.push(step.elementId));

    const runPromise = player.start();
    player.stop();
    await runPromise;

    expect(stepEvents.length).to.be.lessThan(stubScenario.steps.length);
    expect(player.isRunning()).to.be.false;
  });

  it('getPartialXml returns XML containing only elements up to index', () => {
    const player = new CopilotPlayer(stubScenario);
    const partialAfterFirst = player.getPartialXml(0);
    expect(partialAfterFirst).to.include('id="e1"');
    expect(partialAfterFirst).to.not.include('id="e2"');
  });

});
