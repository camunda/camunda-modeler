'use strict';

var path = require('path');

var findTemplates = require('../../../../lib/client-config/providers/find-templates');


describe('client-config/provider/find-templates', function() {

  it('should locate templates', function() {

    // when
    var elementTemplates = findTemplates([
      path.join(__dirname + '/../../../fixtures/element-templates/resources')
    ]);

    // then
    expect(elementTemplates).to.eql([
      { id: 'com.foo.Bar', FOO: 'BAR' },
      { id: 'single', FOO: 'BAR' }
    ]);

  });


  it('should throw on broken JSON configuration', function() {

    // when

    function load() {
      findTemplates([
        path.join(__dirname + '/../../../fixtures/element-templates/broken/resources')
      ]);
    }

    // then
    expect(load).to.throw(
      /template .* parse error: Unexpected token I.*/
    );

  });

});