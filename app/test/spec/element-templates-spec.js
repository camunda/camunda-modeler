'use strict';

var path = require('path');

var ElementTemplates = require('../../lib/element-templates');


describe('ElementTemplates', function() {

  it('should load templates from path', function() {

    // when
    var elementTemplates = ElementTemplates.load([
      path.join(__dirname + '/../fixtures')
    ]);

    // then
    expect(elementTemplates.get()).to.eql([
      { id: 'com.foo.Bar', FOO: 'BAR' },
      { id: 'com.foo.Bar' },
      { id: 'single', FOO: 'BAR' }
    ]);

  });

});