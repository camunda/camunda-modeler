/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import configureModeler from '../configure';


describe('tabs/dmn/util - configure', function() {

  describe('configureModeler', function() {

    describe('should recognize plug-in points', function() {

      it('dmn.modeler.drd.additionalModules', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.drd.additionalModules', module1 ],
          [ 'dmn.modeler.drd.additionalModules', module2 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          drd: {
            additionalModules: [
              existingModule
            ]
          }
        });

        // then
        expect(options).to.eql({
          drd: {
            additionalModules: [
              existingModule,
              module1,
              module2
            ]
          }

        });

        expect(warnings).to.be.empty;
      });


      it('dmn.modeler.drd.additionalModules', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.decisionTable.additionalModules', module1 ],
          [ 'dmn.modeler.decisionTable.additionalModules', module2 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          decisionTable: {
            additionalModules: [
              existingModule
            ]
          }
        });

        // then
        expect(options).to.eql({
          decisionTable: {
            additionalModules: [
              existingModule,
              module1,
              module2
            ]
          }

        });

        expect(warnings).to.be.empty;
      });


      it('dmn.modeler.drd.additionalModules', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.literalExpression.additionalModules', module1 ],
          [ 'dmn.modeler.literalExpression.additionalModules', module2 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          literalExpression: {
            additionalModules: [
              existingModule
            ]
          }
        });

        // then
        expect(options).to.eql({
          literalExpression: {
            additionalModules: [
              existingModule,
              module1,
              module2
            ]
          }

        });

        expect(warnings).to.be.empty;
      });


      it('dmn.modeler.moddleExtension', function() {

        // given
        var fooExtension = { name: 'foo' };
        var barExtension = { name: 'bar' };

        var existingExtension = { name: 'existing' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.moddleExtension', fooExtension ],
          [ 'dmn.modeler.moddleExtension', barExtension ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          moddleExtensions: {
            existing: existingExtension
          }
        });

        // then
        expect(options).to.eql({
          moddleExtensions: {
            existing: existingExtension,
            foo: fooExtension,
            bar: barExtension
          }
        });

        expect(warnings).to.be.empty;
      });

    });


    describe('should collect warnings', function() {

      it('dmn.modeler.moddleExtension', function() {

        // given
        var noNameExtension = { };
        var existingExtension = { name: 'existing' };
        var existingOverrideExtension = { name: 'existing' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.moddleExtension', noNameExtension ],
          [ 'dmn.modeler.moddleExtension', existingOverrideExtension ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          moddleExtensions: {
            existing: existingExtension
          }
        });

        // then
        expect(options).to.eql({
          moddleExtensions: {
            existing: existingExtension
          }
        });

        expect(warnings).to.have.length(2);

        expect(warnings[0].message).to.eql(
          'dmn.modeler.moddleExtension is missing <name> property'
        );

        expect(warnings[1].message).to.eql(
          'dmn.modeler.moddleExtension overrides moddle extension with name <existing>'
        );
      });

    });

  });

});


// helpers /////////////////////

function setupPlugins(plugins) {
  return function(type) {
    return plugins.filter(p => p[0] === type).map(p => p[1]);
  };
}
