/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import { isTextInput } from '../isInput';


describe('util/dom/isInput', function() {

  describe('isTextInput', function() {

    it('should detect <textarea>', function() {

      // given
      const textarea = document.createElement('textarea');

      // then
      expect(isTextInput(textarea)).to.be.true;
    });


    it('should detect <input>', function() {

      // given
      const input = document.createElement('input');

      // then
      expect(isTextInput(input)).to.be.true;
    });


    it('should detect contentEditable element', function() {

      // given
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');

      // then
      expect(isTextInput(div)).to.be.true;
    });


    it('should detect child of contentEditable element', function() {

      // given
      const container = document.createElement('div');
      container.setAttribute('contenteditable', 'true');

      const span = document.createElement('span');
      container.appendChild(span);

      // then
      expect(isTextInput(span)).to.be.true;
    });


    it('should not detect non-input element', function() {

      // given
      const div = document.createElement('div');

      // then
      expect(isTextInput(div)).to.be.false;
    });

  });

});
