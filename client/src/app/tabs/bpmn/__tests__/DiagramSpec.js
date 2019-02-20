/**
 * Copyright (c) Camunda Services GmbH.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('tabs/bpmn', function() {

  describe('initial diagram', function() {

    it('should contain placeholders', function() {

      // when
      const contents = require('../diagram.bpmn');

      // then
      expect(contents).to.contain('id="Definitions_{{ ID }}"');
      expect(contents).to.contain('id="Process_{{ ID:process }}"');
    });

  });

});