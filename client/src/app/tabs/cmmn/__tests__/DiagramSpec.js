describe('tabs/cmmn', function() {

  describe('initial diagram', function() {

    it('should contain Definitions_{{ ID }} placeholder', function() {

      // when
      const contents = require('../diagram.cmmn');

      // then
      expect(contents).to.contain('id="Definitions_{{ ID }}"');
    });

  });

});