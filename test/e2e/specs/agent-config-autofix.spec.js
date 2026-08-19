/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

'use strict';

const { test, expect } = require('../harness/test');
const { copyFixture } = require('../harness/files');

const Modeler = require('../pages/Modeler');

/**
 * Covers the agent config autofix affordances contributed by
 * `@camunda/linting-autofix`, which Web Modeler registers too.
 *
 * The point of driving this end to end here rather than trusting the library's
 * own suite is that the library's suite cannot see the integration: whether
 * Desktop Modeler actually registers the module, loads its stylesheet, and
 * renders its entries through the properties panel it ships. Everything below
 * fails if any one of those is missing.
 */
test.describe('agent config autofix', function() {

  test('should fix a malformed fromAi() key from the properties panel', async function({ launch, tmp }) {

    // given a tool whose fromAi() call is missing the required `toolCall.`
    // prefix, so the agent never supplies the value at runtime
    const file = await copyFixture('agentic-tool.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const propertiesPanel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await app.step('select the tool and reveal its input mapping', async () => {
      await editor.selectElement('ToolTask_1');

      await propertiesPanel.waitForLoad();
      await propertiesPanel.openGroup('Input mapping');
      await propertiesPanel.openListItem('ToolTask_1-input-0');
    });

    const sourceEntry = propertiesPanel.entry('ToolTask_1-input-0-source');
    const fixEntry = propertiesPanel.entry('ToolTask_1-input-0-source-fix');

    // then the module is loaded and offers a correction on the offending field
    await expect(sourceEntry).toContainText('fromAi(url)');
    await expect(fixEntry).toBeAttached();

    const fixButton = fixEntry.locator('[data-test="agent-config-autofill-button"]');

    /*
     * Visibility is asserted on the button, not on the entry around it. Once the
     * pill is aligned onto the message above, its entry is deliberately zero
     * height (the button is lifted out of flow, so the entry must not reserve a
     * row), and Playwright reads a zero-size box as hidden. The entry is
     * therefore checked for attachment only, and the thing a person can actually
     * see and click is checked for visibility.
     */
    await expect(fixButton).toBeVisible();

    // and it is labelled and named for what it does, not with a bare verb: the
    // visible word is short because it sits on the message it resolves, while
    // the accessible name carries the specific correction, which is all a
    // screen-reader or voice-control user has to pick between several pills by
    await expect(fixButton).toHaveText('Fix');
    await expect(fixButton).toHaveAttribute('aria-label', /^Fix: /);

    // when accepting the correction
    await app.step('accept the correction', async () => {
      await fixButton.click();
    });

    // then the key is rewritten in place, and the offer withdraws because the
    // mistake it named is gone
    await expect(sourceEntry).toContainText('fromAi(toolCall.url)');
    await expect(fixEntry).toHaveCount(0);

    // and the fix is a single undo step
    await app.step('undo the correction', async () => {
      await editor.undo();
    });

    await expect(sourceEntry).toContainText('fromAi(url)');
    await expect(fixEntry).toBeAttached();
    await expect(fixButton).toBeVisible();
  });


  test('should offer a labelled input-side pill below a blank input', async function({ launch, tmp }) {

    // given a tool with a blank input source, which is what the seeding
    // affordance is offered on
    const file = await copyFixture('agentic-tool.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const propertiesPanel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await editor.selectElement('ToolTask_BlankInput');

    await propertiesPanel.waitForLoad();
    await propertiesPanel.openGroup('Input mapping');
    await propertiesPanel.openListItem('ToolTask_BlankInput-input-0');

    /*
     * then the affordance is its own entry directly below the field, not an
     * unlabelled icon painted over the field's label row. Asserting the entry id
     * is what pins that: the id only exists because the provider inserts a
     * sibling entry after the source field, so a regression back to wrapping the
     * field in place fails here rather than merely looking different.
     */
    const pillEntry = propertiesPanel.entry('ToolTask_BlankInput-input-0-source-from-ai');

    await expect(pillEntry).toBeVisible();

    const pill = pillEntry.locator('[data-test="agent-config-autofill-button"]');

    // and it carries a visible label naming what happens to the value. Three
    // rounds of user testing failed to find this control while it was a bare
    // sparkle icon, which is the whole reason it reads as text now.
    await expect(pill).toHaveText('Input from agent');

    // when seeding the field
    await app.step('seed the input from the agent', async () => {
      await pill.click();
    });

    // then a complete fromAi() call is written, and the offer withdraws because
    // the field it was offered on is no longer blank
    await expect(propertiesPanel.entry('ToolTask_BlankInput-input-0-source'))
      .toContainText('fromAi(toolCall.recipient');

    await expect(pillEntry).toHaveCount(0);
  });


  test('should not offer a correction for a well-formed fromAi() key', async function({ launch, tmp }) {

    // given a tool whose fromAi() call already names `toolCall.<key>`
    const file = await copyFixture('agentic-tool.bpmn', tmp);

    const app = await launch({ openFile: file });

    const modeler = new Modeler(app);
    const editor = modeler.bpmnEditor;
    const propertiesPanel = modeler.propertiesPanel;

    await editor.canvas().waitFor();

    await editor.selectElement('ToolTask_NoOutput');

    await propertiesPanel.waitForLoad();
    await propertiesPanel.openGroup('Input mapping');
    await propertiesPanel.openListItem('ToolTask_NoOutput-input-0');

    // then the field renders as authored, with nothing to correct — the module
    // decorates what is actually wrong, not every field it can reach
    await expect(propertiesPanel.entry('ToolTask_NoOutput-input-0-source'))
      .toContainText('fromAi(toolCall.message');

    await expect(propertiesPanel.entry('ToolTask_NoOutput-input-0-source-fix')).toHaveCount(0);
  });

});
