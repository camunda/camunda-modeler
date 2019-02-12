describe('tabs/dmn', function() {

  describe('initial diagram', function() {

    it('should contain Definitions_{{ ID }} placeholder', function() {

      // when
      const contents = require('../diagram.dmn');

      // then
      expect(contents).to.contain('id="Definitions_{{ ID }}"');
    });

  });


  describe('initial table', function() {

    it('should contain Definitions_{{ ID }} placeholder', function() {

      // when
      const contents = require('../table.dmn');

      // then
      expect(contents).to.contain('id="Definitions_{{ ID }}"');
    });

  });

});