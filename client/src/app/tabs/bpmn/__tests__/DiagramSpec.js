describe('tabs/bpmn', function() {

  describe('initial diagram', function() {

    it('should contain Definitions_{{ ID }} placeholder', function() {

      // when
      const contents = require('../diagram.bpmn');

      // then
      expect(contents).to.contain('id="Definitions_{{ ID }}"');
    });

  });

});