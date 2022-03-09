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


describe('tabs/bpmn/util - configure', function() {

  describe('configureModeler', function() {

    describe('should recognize plug-in points', function() {


      it('bpmn.modeler.additionalModules - generic module types - no config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.additionalModules', module1 ],
          [ 'bpmn.modeler.additionalModules', module2 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          additionalModules: [
            existingModule
          ]
        });

        // then
        expect(options).to.eql({
          additionalModules: [
            existingModule,
            module1,
            module2
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('bpmn.modeler.additionalModules - platform module types - platform config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'bpmn.platform.modeler.additionalModules', module1 ],
          [ 'bpmn.platform.modeler.additionalModules', module2 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          additionalModules: [
            existingModule
          ]
        }, null, 'platform');

        // then
        expect(options).to.eql({
          additionalModules: [
            existingModule,
            module1,
            module2
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('bpmn.modeler.additionalModules - cloud module types - cloud config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'bpmn.cloud.modeler.additionalModules', module1 ],
          [ 'bpmn.cloud.modeler.additionalModules', module2 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          additionalModules: [
            existingModule
          ]
        }, null, 'cloud');

        // then
        expect(options).to.eql({
          additionalModules: [
            existingModule,
            module1,
            module2
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('bpmn.modeler.additionalModules - all module types - no config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var module3 = { __id: 3 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.additionalModules', module1 ],
          [ 'bpmn.platform.modeler.additionalModules', module2 ],
          [ 'bpmn.cloud.modeler.additionalModules', module3 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          additionalModules: [
            existingModule
          ]
        });

        // then
        expect(options).to.eql({
          additionalModules: [
            existingModule,
            module1
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('bpmn.modeler.additionalModules - all module types - platform config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var module3 = { __id: 3 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.additionalModules', module1 ],
          [ 'bpmn.platform.modeler.additionalModules', module2 ],
          [ 'bpmn.cloud.modeler.additionalModules', module3 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          additionalModules: [
            existingModule
          ]
        }, null, 'platform');

        // then
        expect(options).to.eql({
          additionalModules: [
            existingModule,
            module1,
            module2
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('bpmn.modeler.additionalModules - all module types - cloud config', function() {

        // given
        var module1 = { __id: 1 };
        var module2 = { __id: 2 };
        var module3 = { __id: 3 };
        var existingModule = { __id: 'EXISTING' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.additionalModules', module1 ],
          [ 'bpmn.platform.modeler.additionalModules', module2 ],
          [ 'bpmn.cloud.modeler.additionalModules', module3 ]
        ]);

        // when
        var {
          options,
          warnings
        } = configureModeler(getPlugins, {
          additionalModules: [
            existingModule
          ]
        }, null, 'cloud');

        // then
        expect(options).to.eql({
          additionalModules: [
            existingModule,
            module1,
            module3
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('bpmn.modeler.moddleExtension - platform', function() {

        // given
        var fooExtension = { name: 'foo' };
        var barExtension = { name: 'bar' };
        var foobarExtension = { name: 'foobar' };

        var existingExtension = { name: 'existing' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.moddleExtension', fooExtension ],
          [ 'bpmn.platform.modeler.moddleExtension', barExtension ],
          [ 'bpmn.cloud.modeler.moddleExtension', foobarExtension ],
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


      it('bpmn.modeler.moddleExtension - cloud', function() {

        // given
        var fooExtension = { name: 'foo' };
        var barExtension = { name: 'bar' };
        var foobarExtension = { name: 'foobar' };

        var existingExtension = { name: 'existing' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.moddleExtension', fooExtension ],
          [ 'bpmn.platform.modeler.moddleExtension', barExtension ],
          [ 'bpmn.cloud.modeler.moddleExtension', foobarExtension ],
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


      it('bpmn.modeler.configure', function() {

        // given
        function configureLinting(config) {

          expect(config).to.eql({ a: 'B' });

          return {
            ...config,
            linting: { foo: 'BAR' }
          };
        }

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.configure', configureLinting ]
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

      it('bpmn.modeler.moddleExtension', function() {

        // given
        var noNameExtension = { };
        var existingExtension = { name: 'existing' };
        var existingOverrideExtension = { name: 'existing' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.moddleExtension', noNameExtension ],
          [ 'bpmn.modeler.moddleExtension', existingOverrideExtension ]
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
          'A bpmn moddle extension plugin is missing a <name> property'
        );

        expect(warnings[1].message).to.eql(
          'A bpmn moddle extension with name <existing> was overriden due to a clash'
        );
      });

      it('bpmn.modeler.moddleExtension && bpmn.{platform}.modeler.moddleExtension', function() {

        // given
        var existingGenericExtension = { name: 'existingP' };
        var existingGenericExtension2 = { name: 'existingC' };
        var existingPlatformExtension = { name: 'existingP' };
        var existingCloudExtension = { name: 'existingC' };

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.moddleExtension', existingGenericExtension ],
          [ 'bpmn.modeler.moddleExtension', existingGenericExtension2 ],
          [ 'bpmn.platform.modeler.moddleExtension', existingPlatformExtension ],
          [ 'bpmn.cloud.modeler.moddleExtension', existingCloudExtension ]
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
          'A bpmn moddle extension with name <existingP> was overriden due to a clash'
        );

        expect(warningsCloud).to.have.length(1);

        expect(warningsCloud[0].message).to.eql(
          'A bpmn moddle extension with name <existingC> was overriden due to a clash'
        );
      });


      it('bpmn.modeler.configure', function() {

        // given
        function configureNoResult() {}

        var getPlugins = setupPlugins([
          [ 'bpmn.modeler.configure', configureNoResult ]
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
          'bpmn.modeler.configure does not return options'
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
