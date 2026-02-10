/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/* global sinon */

import { GridBehavior } from '../grid';


describe('tabs/util - GridBehavior', function() {

  describe('constructor', function() {

    it('should create instance with adapter', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub()
      };

      // when
      const gridBehavior = new GridBehavior(adapter);

      // then
      expect(gridBehavior).to.exist;
      expect(gridBehavior.adapter).to.equal(adapter);
    });


    it('should use default visible = true when not specified', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub()
      };

      // when
      const gridBehavior = new GridBehavior(adapter);

      // then
      expect(gridBehavior.defaultVisible).to.be.true;
    });


    it('should use custom default visible when specified', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub()
      };

      // when
      const gridBehavior = new GridBehavior(adapter, true);

      // then
      expect(gridBehavior.defaultVisible).to.be.true;
    });

  });


  describe('update', function() {

    it('should toggle grid to visible when specified in layout', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = { grid: { visible: true } };

      // when
      gridBehavior.update(layout);

      // then
      expect(grid.toggle).to.have.been.calledOnceWith(true);
    });


    it('should toggle grid to hidden when specified in layout', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = { grid: { visible: false } };

      // when
      gridBehavior.update(layout);

      // then
      expect(grid.toggle).to.have.been.calledOnceWith(false);
    });


    it('should use default (true) when grid not specified in layout', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = {};

      // when
      gridBehavior.update(layout);

      // then
      expect(grid.toggle).to.have.been.calledOnceWith(true);
    });


    it('should use custom default when grid not specified in layout', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter, false);
      const layout = {};

      // when
      gridBehavior.update(layout);

      // then
      expect(grid.toggle).to.have.been.calledOnceWith(false);
    });


    it('should not fail when grid is not available', function() {

      // given
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(null)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = { grid: { visible: true } };

      // when/then
      expect(() => {
        gridBehavior.update(layout);
      }).not.to.throw();
    });


    it('should not fail when diagram is not available', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub().returns(null)
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = { grid: { visible: true } };

      // when/then
      expect(() => {
        gridBehavior.update(layout);
      }).not.to.throw();
    });

  });


  describe('getGrid', function() {

    it('should return grid from diagram', function() {

      // given
      const grid = {};
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);

      // when
      const result = gridBehavior.getGrid();

      // then
      expect(result).to.equal(grid);
    });


    it('should return null when grid not available', function() {

      // given
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(null)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);

      // when
      const result = gridBehavior.getGrid();

      // then
      expect(result).to.be.null;
    });


    it('should return null when diagram not available', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub().returns(null)
      };
      const gridBehavior = new GridBehavior(adapter);

      // when
      const result = gridBehavior.getGrid();

      // then
      expect(result).to.be.null;
    });

  });


  describe('toggleGrid', function() {

    it('should toggle grid from visible to hidden', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub()
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = { grid: { visible: true } };
      const onLayoutChanged = sinon.spy();

      // when
      gridBehavior.toggleGrid(layout, onLayoutChanged);

      // then
      expect(onLayoutChanged).to.have.been.calledOnceWith({
        grid: { visible: false }
      });
    });


    it('should toggle grid from hidden to visible', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub()
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = { grid: { visible: false } };
      const onLayoutChanged = sinon.spy();

      // when
      gridBehavior.toggleGrid(layout, onLayoutChanged);

      // then
      expect(onLayoutChanged).to.have.been.calledOnceWith({
        grid: { visible: true }
      });
    });


    it('should toggle from undefined (default on) to off', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub()
      };
      const gridBehavior = new GridBehavior(adapter);
      const layout = {};
      const onLayoutChanged = sinon.spy();

      // when
      gridBehavior.toggleGrid(layout, onLayoutChanged);

      // then
      expect(onLayoutChanged).to.have.been.calledOnceWith({
        grid: { visible: false }
      });
    });


    it('should toggle from undefined (custom default off) to on', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub()
      };
      const gridBehavior = new GridBehavior(adapter, false);
      const layout = {};
      const onLayoutChanged = sinon.spy();

      // when
      gridBehavior.toggleGrid(layout, onLayoutChanged);

      // then
      expect(onLayoutChanged).to.have.been.calledOnceWith({
        grid: { visible: true }
      });
    });

  });


  describe('hasGrid', function() {

    it('should return true when grid is available', function() {

      // given
      const grid = {};
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);

      // when
      const result = gridBehavior.hasGrid();

      // then
      expect(result).to.be.true;
    });


    it('should return false when grid is not available', function() {

      // given
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(null)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);

      // when
      const result = gridBehavior.hasGrid();

      // then
      expect(result).to.be.false;
    });


    it('should return false when diagram is not available', function() {

      // given
      const adapter = {
        getDiagram: sinon.stub().returns(null)
      };
      const gridBehavior = new GridBehavior(adapter);

      // when
      const result = gridBehavior.hasGrid();

      // then
      expect(result).to.be.false;
    });

  });


  describe('checkUpdate', function() {

    it('should update grid when layout changes', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const prevLayout = { grid: { visible: true } };
      const newLayout = { grid: { visible: false } };

      // when
      gridBehavior.checkUpdate(prevLayout, newLayout);

      // then
      expect(grid.toggle).to.have.been.calledOnceWith(false);
    });


    it('should not update grid when layout does not change', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const prevLayout = { grid: { visible: true } };
      const newLayout = { grid: { visible: true } };

      // when
      gridBehavior.checkUpdate(prevLayout, newLayout);

      // then
      expect(grid.toggle).not.to.have.been.called;
    });


    it('should update when grid becomes defined', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const prevLayout = {};
      const newLayout = { grid: { visible: true } };

      // when
      gridBehavior.checkUpdate(prevLayout, newLayout);

      // then
      expect(grid.toggle).to.have.been.calledOnceWith(true);
    });


    it('should update when grid becomes undefined', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const prevLayout = { grid: { visible: true } };
      const newLayout = {};

      // when
      gridBehavior.checkUpdate(prevLayout, newLayout);

      // then
      expect(grid.toggle).to.have.been.calledOnceWith(true);
    });


    it('should not update when both are undefined', function() {

      // given
      const grid = {
        toggle: sinon.spy()
      };
      const diagram = {
        get: sinon.stub().withArgs('grid', false).returns(grid)
      };
      const adapter = {
        getDiagram: sinon.stub().returns(diagram)
      };
      const gridBehavior = new GridBehavior(adapter);
      const prevLayout = {};
      const newLayout = {};

      // when
      gridBehavior.checkUpdate(prevLayout, newLayout);

      // then
      expect(grid.toggle).not.to.have.been.called;
    });

  });

});
