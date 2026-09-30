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

import CamundaDmnModeler from '../DmnModeler';

import diagramXML from '../../__tests__/diagram.dmn';


describe('cloud-dmn - DmnModeler', function() {

  describe('#overview', function() {

    let container, overviewContainer, modeler;

    beforeEach(function() {
      container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.width = '600px';
      container.style.height = '400px';
      document.body.appendChild(container);

      overviewContainer = document.createElement('div');
      overviewContainer.style.position = 'absolute';
      overviewContainer.style.width = '350px';
      overviewContainer.style.height = '400px';
      document.body.appendChild(overviewContainer);

      modeler = new CamundaDmnModeler({
        container,
        position: 'absolute',
        keyboard: { bind: false },
        exporter: { name: 'test', version: '1' },
        settings: { get: () => false }
      });
    });

    afterEach(function() {
      container.remove();
      overviewContainer.remove();
    });


    // regression test for https://github.com/camunda/camunda-modeler/issues/4549
    //
    // Scenario: the overview panel is closed (its container is rendered at
    // zero width, cf. OverviewContainer#getLayoutFromProps), the diagram
    // content changes while it is closed (re-importing the overview XML,
    // which invalidates diagram-js' cached viewbox while the container
    // reports a width of 0), and the panel is then reopened.
    //
    // `DmnModeler#updateOverview` only calls `canvas.resized()` the very
    // first time the overview is attached to its DOM node (comparing
    // `parentNode` identity, which never changes when the panel is only
    // toggled open/closed via CSS). So the overview canvas keeps using the
    // viewbox it cached while the container was 0px wide, and the DMN
    // diagram renders shifted once the panel is visible again.
    it('should keep overview viewbox in sync after it is updated while closed, then reopened', async function() {

      // given
      await modeler.importXML(diagramXML);

      // first attach = overview panel initially open
      await modeler.showOverview(diagramXML);
      modeler.updateOverview(overviewContainer, true);

      const overviewViewer = modeler._overview.getActiveViewer();
      const canvas = overviewViewer.get('canvas');

      // assume: sane viewbox while the panel is open
      expect(canvas.viewbox().outer.width).to.equal(350);

      // when

      // (1) close the overview panel: the container collapses to 0 width,
      // exactly like OverviewContainer does via `style={ { width: 0 } }`
      overviewContainer.style.width = '0px';

      // (2) content changes while the overview is closed -- DmnEditor wires
      // this exact call (DmnModeler#_updateOverview) to every
      // `commandStack.changed` on the active viewer
      await modeler.showOverview(diagramXML);

      // (3) reopen the overview panel
      overviewContainer.style.width = '350px';
      modeler.updateOverview(overviewContainer, true);

      // then

      // the container is visibly 350px wide again ...
      expect(canvas.getSize().width).to.equal(350);

      // ... so the diagram's own idea of its viewbox (which callers such as
      // OpenDrgElement#centerViewbox rely on to position the diagram) should
      // match -- instead it stays pinned to the 0px width the container had
      // when the overview was last re-imported, because `updateOverview`
      // only calls `canvas.resized()` on the very first attach
      expect(canvas.viewbox().outer.width).to.equal(350);
    });

  });

});
