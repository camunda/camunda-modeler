describe('tabs/dmn', function() {

  describe('initial diagram', function() {

    it('should contain placeholders', function() {

      // when
      const contents = require('../diagram.dmn');

      // then
      expect(contents).to.contain('id="Definitions_{{ ID }}"');
      expect(contents).to.contain('id="Decision_{{ ID }}"');
    });

  });


  describe('initial table', function() {

    it('should contain placeholders', function() {

      // when
      const contents = require('../table.dmn');

      // then
      expect(contents).to.contain('id="Definitions_{{ ID }}"');
      expect(contents).to.contain('id="Decision_{{ ID }}"');
    });

  });

});