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

import configureEditor from '../configure';


describe('tabs/form/util - configure', function() {

  describe('configureEditor', function() {

    describe('should recognize plug-in points', function() {

      it('form.modeler.editor.additionalModules', function() {

        // given
        const module1 = { __id: 1 };
        const module2 = { __id: 2 };
        const existingModule = { __id: 'EXISTING' };

        const getPlugins = setupPlugins([
          [ 'form.modeler.editor.additionalModules', module1 ],
          [ 'form.modeler.editor.additionalModules', module2 ]
        ]);

        // when
        const {
          options,
          warnings
        } = configureEditor(getPlugins, {
          editorAdditionalModules: [ existingModule ]
        });

        // then
        expect(options).to.eql({
          editorAdditionalModules: [
            existingModule,
            module1,
            module2
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('form.modeler.viewer.additionalModules', function() {

        // given
        const module1 = { __id: 1 };
        const module2 = { __id: 2 };
        const existingModule = { __id: 'EXISTING' };

        const getPlugins = setupPlugins([
          [ 'form.modeler.viewer.additionalModules', module1 ],
          [ 'form.modeler.viewer.additionalModules', module2 ]
        ]);

        // when
        const {
          options,
          warnings
        } = configureEditor(getPlugins, {
          viewerAdditionalModules: [ existingModule ]
        });

        // then
        expect(options).to.eql({
          viewerAdditionalModules: [
            existingModule,
            module1,
            module2
          ]
        });

        expect(warnings).to.be.empty;
      });


      it('form.modeler.editor.additionalModules without existing modules', function() {

        // given
        const module1 = { __id: 1 };

        const getPlugins = setupPlugins([
          [ 'form.modeler.editor.additionalModules', module1 ]
        ]);

        // when
        const { options } = configureEditor(getPlugins);

        // then
        expect(options).to.eql({
          editorAdditionalModules: [ module1 ]
        });
      });


      it('form.{platform}.modeler.{component}.additionalModules', function() {

        // given
        const genericEditorModule = { __id: 'generic-editor' };
        const genericViewerModule = { __id: 'generic-viewer' };
        const cloudEditorModule = { __id: 'cloud-editor' };
        const cloudViewerModule = { __id: 'cloud-viewer' };
        const platformEditorModule = { __id: 'platform-editor' };
        const platformViewerModule = { __id: 'platform-viewer' };

        const getPlugins = setupPlugins([
          [ 'form.modeler.editor.additionalModules', genericEditorModule ],
          [ 'form.modeler.viewer.additionalModules', genericViewerModule ],
          [ 'form.cloud.modeler.editor.additionalModules', cloudEditorModule ],
          [ 'form.cloud.modeler.viewer.additionalModules', cloudViewerModule ],
          [ 'form.platform.modeler.editor.additionalModules', platformEditorModule ],
          [ 'form.platform.modeler.viewer.additionalModules', platformViewerModule ]
        ]);

        // when
        const { options: cloudOptions } = configureEditor(getPlugins, {}, null, 'cloud');
        const { options: platformOptions } = configureEditor(getPlugins, {}, null, 'platform');

        // then
        expect(cloudOptions).to.eql({
          editorAdditionalModules: [ genericEditorModule, cloudEditorModule ],
          viewerAdditionalModules: [ genericViewerModule, cloudViewerModule ]
        });

        expect(platformOptions).to.eql({
          editorAdditionalModules: [ genericEditorModule, platformEditorModule ],
          viewerAdditionalModules: [ genericViewerModule, platformViewerModule ]
        });
      });


      it('form.modeler.configure', function() {

        // given
        const module1 = { __id: 1 };

        function configure(options) {
          return {
            ...options,
            editorAdditionalModules: [
              ...(options.editorAdditionalModules || []),
              module1
            ]
          };
        }

        const getPlugins = setupPlugins([
          [ 'form.modeler.configure', configure ]
        ]);

        // when
        const {
          options,
          warnings
        } = configureEditor(getPlugins);

        // then
        expect(options).to.eql({
          editorAdditionalModules: [ module1 ]
        });

        expect(warnings).to.be.empty;
      });


      it('form.modeler.configure without result', function() {

        // given
        function configureNoResult() {}

        const getPlugins = setupPlugins([
          [ 'form.modeler.configure', configureNoResult ]
        ]);

        // when
        const {
          options,
          warnings
        } = configureEditor(getPlugins);

        // then
        expect(options).to.eql({});

        expect(warnings).to.have.length(1);

        expect(warnings[0].message).to.eql(
          'form.modeler.configure does not return options'
        );
      });


      it('form.modeler.configure throwing', function() {

        // given
        const error = new Error('foo');

        function configureError() {
          throw error;
        }

        const getPlugins = setupPlugins([
          [ 'form.modeler.configure', configureError ]
        ]);

        // when
        const {
          options,
          warnings
        } = configureEditor(getPlugins, { foo: 'bar' });

        // then
        expect(options).to.eql({ foo: 'bar' });

        expect(warnings).to.eql([ error ]);
      });

    });


    describe('middlewares', function() {

      it('should expose middlewares via callback', function() {

        // given
        const getPlugins = setupPlugins([]);

        function middleware(options) {
          return {
            ...options,
            foo: 'bar'
          };
        }

        // when
        const { options } = configureEditor(getPlugins, {}, (middlewares) => {
          middlewares.push(middleware);
        });

        // then
        expect(options).to.eql({ foo: 'bar' });
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
