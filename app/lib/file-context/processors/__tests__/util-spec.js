/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

const fs = require('fs');
const path = require('path');
const sinon = require('sinon');

const {
  isCamunda8BPMN,
  isCamunda8DMN,
  isCamunda8Form,
  findCamundaProjectFile,
  isCamundaProjectFile
} = require('../util');


describe('util', function() {

  describe('isCamunda8', function() {

    it('should return true for Camunda 8 BPMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda8.bpmn'), 'utf8');

      // when
      const result = isCamunda8BPMN(file);

      expect(result).to.be.true;
    });


    it('should return false for Camunda 7 BPMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda7.bpmn'), 'utf8');

      // when
      const result = isCamunda8BPMN(file);

      expect(result).to.be.false;
    });


    it('should return true for Camunda 8 DMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda8.dmn'), 'utf8');

      // when
      const result = isCamunda8DMN(file);

      expect(result).to.be.true;
    });


    it('should return false for Camunda 7 DMN file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda7.dmn'), 'utf8');

      // when
      const result = isCamunda8DMN(file);

      expect(result).to.be.false;
    });


    it('should return true for Camunda 8 form file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda8.form'), 'utf8');

      // when
      const result = isCamunda8Form(file);

      expect(result).to.be.true;
    });


    it('should return false for Camunda 7 form file', function() {

      // given
      const file = fs.readFileSync(path.resolve(__dirname, './fixtures/camunda7.form'), 'utf8');

      // when
      const result = isCamunda8Form(file);

      expect(result).to.be.false;
    });

  });


  describe('findCamundaProjectFile', function() {

    afterEach(function() {
      sinon.restore();
    });

    describe('should find Camunda project', function() {

      it('for absolute file reference', function() {

        // given
        const diagramPath = path.resolve(__dirname, './fixtures/application/nested/diagram.bpmn');
        const expectedApplicationPath = path.resolve(__dirname, './fixtures/application/.process-application');

        // when
        const applicationFile = findCamundaProjectFile(diagramPath);

        // then
        expect(applicationFile).to.eql(expectedApplicationPath);
      });


      it('for relative file reference', function() {

        // given
        const diagramPath = path.relative(
          process.cwd(),
          path.resolve(__dirname, './fixtures/application/nested/diagram.bpmn')
        );

        const expectedApplicationPath = path.relative(
          process.cwd(),
          path.resolve(__dirname, './fixtures/application/.process-application'),
        );

        // when
        const applicationFile = findCamundaProjectFile(diagramPath);

        // then
        expect(applicationFile).to.eql(expectedApplicationPath);
      });


      it('with new marker', function() {

        // given
        const diagramPath = path.resolve('/project/nested/diagram.bpmn');
        sinon.stub(fs, 'readdirSync').returns([ 'camunda-project.json' ]);

        // when
        const projectFile = findCamundaProjectFile(diagramPath);

        // then
        expect(projectFile).to.eql(path.resolve('/project/nested/camunda-project.json'));
      });


      it('should prefer new marker in same directory', function() {

        // given
        const diagramPath = path.resolve('/project/diagram.bpmn');
        sinon.stub(fs, 'readdirSync').returns([ '.process-application', 'camunda-project.json' ]);

        // when
        const projectFile = findCamundaProjectFile(diagramPath);

        // then
        expect(projectFile).to.eql(path.resolve('/project/camunda-project.json'));
      });


      it('should prefer legacy marker in nested directory over new marker in parent', function() {

        // given
        const diagramPath = path.resolve('/project/nested/diagram.bpmn');

        sinon.stub(fs, 'readdirSync').callsFake(dirName => {
          return dirName === path.dirname(diagramPath)
            ? [ '.process-application' ]
            : [ 'camunda-project.json' ];
        });

        // when
        const projectFile = findCamundaProjectFile(diagramPath);

        // then
        expect(projectFile).to.eql(path.resolve('/project/nested/.process-application'));
      });

    });


    describe('should handle not found', function() {

      it('for absolute reference', function() {

        // given
        const diagramPath = path.resolve(__dirname, './fixtures/camunda8.bpmn');

        // when
        const applicationFile = findCamundaProjectFile(diagramPath);

        // then
        expect(applicationFile).to.eql(false);
      });


      it('for relative reference', function() {

        // given
        const diagramPath = './app/non-existing.bpmn';

        // when
        const applicationFile = findCamundaProjectFile(diagramPath);

        // then
        expect(applicationFile).to.eql(false);
      });

    });


    it('should handle non-existing diagram', function() {

      // given
      const diagramPath = path.resolve(__dirname, './fixtures/non-existing.bpmn');

      // when
      const applicationFile = findCamundaProjectFile(diagramPath);

      expect(applicationFile).to.eql(false);
    });


    describe('should handle EPERM error during directory scan', function() {

      it('should return false', function() {

        // given
        const diagramPath = path.resolve(__dirname, './fixtures/application/nested/diagram.bpmn');

        const epermError = Object.assign(new Error('EPERM: operation not permitted, scandir'), { code: 'EPERM' });
        sinon.stub(fs, 'readdirSync').throws(epermError);

        // when
        const applicationFile = findCamundaProjectFile(diagramPath);

        // then
        expect(applicationFile).to.eql(false);
      });

    });
  });


  describe('isCamundaProjectFile', function() {

    it('should recognize Camunda project file', function() {

      // when
      const result = isCamundaProjectFile('/project/camunda-project.json');

      // then
      expect(result).to.be.true;
    });


    it('should recognize legacy Camunda project file', function() {

      // when
      const result = isCamundaProjectFile('/project/.process-application');

      // then
      expect(result).to.be.true;
    });

  });

});
