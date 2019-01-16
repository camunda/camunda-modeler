import generateImage from '../generateImage';

var types = [
  'png',
  'jpeg'
];


describe('util - generateImage', function() {

  const svg = require('./diagram.svg');

  types.forEach(function(type) {

    it('should export <' + type + '>', function() {

      const image = generateImage(type, svg);

      expect(image).to.exist;
    });

  });

});
