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

      it('dmn.modeler.boxedExpression.additionalModules', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.boxedExpression.additionalModules', module1 ],
          [ 'dmn.modeler.boxedExpression.additionalModules', module2 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          boxedExpression: {
            additionalModules: [
              existingModule
            ]
          }
        });

        // then
        expect(options).to.eql({
          boxedExpression: {
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


      it('dmn.modeler.decisionTable.additionalModules', function() {

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


      it('dmn.modeler.literalExpression.additionalModules', function() {

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


      it('dmn.modeler.drd.additionalModules - generic module types - no config', function() {

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


      it('dmn.modeler.drd.additionalModules - platform module types - platform config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.platform.modeler.drd.additionalModules', module1 ],
          [ 'dmn.platform.modeler.drd.additionalModules', module2 ]
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
        }, null, 'platform');

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


      it('dmn.modeler.drd.additionalModules - cloud module types - cloud config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.cloud.modeler.drd.additionalModules', module1 ],
          [ 'dmn.cloud.modeler.drd.additionalModules', module2 ]
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
        }, null, 'cloud');

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


      it('dmn.modeler.drd.additionalModules - all module types - no config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var module3 = { __id: 3 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.drd.additionalModules', module1 ],
          [ 'dmn.platform.modeler.drd.additionalModules', module2 ],
          [ 'dmn.cloud.modeler.drd.additionalModules', module3 ]
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
              module1
            ]
          }
        });

        expect(warnings).to.be.empty;
      });


      it('dmn.modeler.drd.additionalModules - all module types - platform config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var module3 = { __id: 3 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.drd.additionalModules', module1 ],
          [ 'dmn.platform.modeler.drd.additionalModules', module2 ],
          [ 'dmn.cloud.modeler.drd.additionalModules', module3 ]
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
        }, null, 'platform');

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


      it('dmn.modeler.drd.additionalModules - all module types - cloud config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var module3 = { __id: 3 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.drd.additionalModules', module1 ],
          [ 'dmn.platform.modeler.drd.additionalModules', module2 ],
          [ 'dmn.cloud.modeler.drd.additionalModules', module3 ]
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
        }, null, 'cloud');

        // then
        expect(options).to.eql({
          drd: {
            additionalModules: [
              existingModule,
              module1,
              module3
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


      it('dmn.modeler.moddleExtension - platform', function() {

        // given
        var fooExtension = { name: 'foo' };
        var barExtension = { name: 'bar' };
        var foobarExtension = { name: 'foobar' };

        var existingExtension = { name: 'existing' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.moddleExtension', fooExtension ],
          [ 'dmn.platform.modeler.moddleExtension', barExtension ],
          [ 'dmn.cloud.modeler.moddleExtension', foobarExtension ],
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          moddleExtensions: {
            existing: existingExtension
          }
        }, null, 'platform');

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


      it('dmn.modeler.moddleExtension - cloud', function() {

        // given
        var fooExtension = { name: 'foo' };
        var barExtension = { name: 'bar' };
        var foobarExtension = { name: 'foobar' };

        var existingExtension = { name: 'existing' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.moddleExtension', fooExtension ],
          [ 'dmn.platform.modeler.moddleExtension', barExtension ],
          [ 'dmn.cloud.modeler.moddleExtension', foobarExtension ],
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          moddleExtensions: {
            existing: existingExtension
          }
        }, null, 'cloud');

        // then
        expect(options).to.eql({
          moddleExtensions: {
            existing: existingExtension,
            foo: fooExtension,
            foobar: foobarExtension
          }
        });

        expect(warnings).to.be.empty;
      });


      it('dmn.modeler.configure', function() {

        // given
        function configureLinting(config) {

          expect(config).to.eql({ a: 'B' });

          return {
            ...config,
            linting: { foo: 'BAR' }
          };
        }

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.configure', configureLinting ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          a: 'B'
        });

        // then
        expect(options).to.eql({
          a: 'B',
          linting: { foo: 'BAR' }
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
          'A dmn moddle extension plugin is missing a <name> property'
        );

        expect(warnings[1].message).to.eql(
          'A dmn moddle extension with name <existing> was overriden due to a clash'
        );
      });


      it('dmn.modeler.moddleExtension && dmn.{platform}.modeler.moddleExtension', function() {

        // given
        var existingGenericExtension = { name: 'existingP' };
        var existingGenericExtension2 = { name: 'existingC' };
        var existingPlatformExtension = { name: 'existingP' };
        var existingCloudExtension = { name: 'existingC' };

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.moddleExtension', existingGenericExtension ],
          [ 'dmn.modeler.moddleExtension', existingGenericExtension2 ],
          [ 'dmn.platform.modeler.moddleExtension', existingPlatformExtension ],
          [ 'dmn.cloud.modeler.moddleExtension', existingCloudExtension ]
        ]);

        // when
        var {
          warnings: warningsPlatform
        } = configureModeler(getPlugins, null, null, 'platform');

        var {
          warnings: warningsCloud
        } = configureModeler(getPlugins, null, null, 'cloud');

        expect(warningsPlatform).to.have.length(1);

        expect(warningsPlatform[0].message).to.eql(
          'A dmn moddle extension with name <existingP> was overriden due to a clash'
        );

        expect(warningsCloud).to.have.length(1);

        expect(warningsCloud[0].message).to.eql(
          'A dmn moddle extension with name <existingC> was overriden due to a clash'
        );
      });


      it('dmn.modeler.configure', function() {

        // given
        function configureNoResult() {}

        var getPlugins = setupPlugins([
          [ 'dmn.modeler.configure', configureNoResult ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins);

        // then
        expect(options).to.eql({});

        expect(warnings).to.have.length(1);

        expect(warnings[0].message).to.eql(
          'dmn.modeler.configure does not return options'
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
