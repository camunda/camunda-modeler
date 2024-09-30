/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import generateImage from '../generateImage';

import { keys } from 'min-dash';

const EXPECTED_JPEG_DATAURL = 'data:image/jpeg;base64,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';

const EXPECTED_PNG_DATAURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAAXNSR0IArs4c6QAABYpJREFUaEPtWWlIVV0UXSblEJlDgjSRaaKJiZqEjagpIqKkqKiphAgKFYmZ0oAQiRmmaAQmOYGKolkOaKAlhFMZJkglFfWjqCDMiCxL1FgHFOl7T8997+nlAzdcMjjT2vNez2h2dnYW/2MxWgWgsvVWLaCyAWAwC7x79w4VFRXo7u7G2NgYxsfH8fnzZ4HPzs4OVlZW2LRpE44ePYr4+HjY29sbBLveAMrKynDr1i0MDg4qetC+ffuQmpqKxMRERfv+XawzgLt37+LChQt4+fKlONPW1hYREREICQnB1q1bYW1tjW3btuHnz5/CIvzev3+P1tZWNDU1if9Tdu/ejby8PLFPF1EM4MuXL4iJicGDBw/EfUeOHEF2djZ8fX0V3d/Z2YlLly7h8ePHYl9gYCCqq6uFIpSIIgB9fX1Cy/RtNzc35Ofni4v1kfb2dpw7dw7Pnz/H5s2b0djYCB8fH+kjpQHcvn0bycnJ4uBjx46htrYWpqam0hcttpBuFh0djba2NrGsvLwcJ06ckDpbCgDNHRQUhJmZGZw9exbXrl2DkZGR1AWyi9jRpKeno7CwEGvWrEFXV5eUWy4J4PXr1/Dw8MDExATS0tJQUFAg+yad1p05cwZFRUWwsLAQmc3JyWnRcxYFQK14enpieHgYAQEBuH//vtDOcgqtzFrBekLFDQ0N6Q6AvpiUlAQXFxehjfXr1y/n2+fP/v79O7y9vfHq1StUVVUhISFB671aLcDA2rFjB5g2qQVqYyWFGe/AgQMiM9GNzc3NNV6vFUBmZqYIVgZvR0fHSr59/i5/f388fPhQFMwrV67IA6Dvb9iwQQRuc3MzQkNDVQHAmhAZGSmqOj1BU/xptEB/fz/2798PMzMzfPv2DevWrVMFwK9fv2BjYwP++/TpU3h5ef3nHRoBXL58WbQHLC51dXWqPH7u0vDwcLDvunr1KujW/4pGAGwX2HDV19cjKipKVQA1NTU4fvw4YmNjwb+lADD6mQUY/Y6OjqoCePHiBVxdXUVVZkBLAXBwcMDbt29F4HAIUVM+fvyILVu2wNnZeb51X/gejS7EoJ2amsL09PSyV96llMN6xAK6ceNGkVCkLGBiYoI/f/7g9+/fqmWguYf++PFDpHR+rNBSAHbu3AnOuPxYjdWUN2/eYNeuXeJjayEFgDWAtWBgYACcXdWU3t5eHDx4EIcOHcKjR4/kAHBguXfvHkpLS+eHGLVA3Lx5EydPnhTpnGldygLsOzivsh6wnKspYWFhaGlpEYM/R08pACMjI9izZw8sLS3x9etXg09fsgphFmT2YU+mLR61dqNzgcyCpmTIln2czDr6PFkPbTWAZ2gFcP36dTH/qtkPzfVBxcXFOHXqlEbMWgFMTk4K+o8USk9PjxguVlI4Uvr5+QmSjF3B2rVrlQHgalKGKSkp2L59O549eyb68pUQtjDu7u749OnTkhTLokM9g4isADVw+PBh0UwZGxsvKwbeyTr05MkT4QEsZIsRCUvSKhwkWEjYVpw+fVpQHsspJHxLSkrEMEXXJSuymCwJgJvv3LkjRjuOmuRtGOCGpleoefJON27cEGeTBA4ODl5SV1IAeAq1Qu1QyIc2NDQI8skQwiaNRZNsHIU0JukcGZEGwMN4AdsMdojMDrm5uYiLi9O50NGilZWVuHjxItj3UyG0NoktWVEEgIeOjo4K07IyUvbu3SvKPFOeEqEyMjIyBOtH4eRHpppdpxJRDICHs7RzyF7I1ZDXZ99CCoZpV9sPHGwSSdXM/cBBhps9TlZWlghcpaITgLlLPnz4gPPnzwuzc3JSIpyymBhycnIE+6ar6AVg4aV0CTJ4zN/afuQjx8P5gi6o1OW0ATQYAF01qO++VQD6alDf/asW0FeD+u7/C0hgCJ5xlCmIAAAAAElFTkSuQmCC';

const expectedImagesByType = {
  png: EXPECTED_PNG_DATAURL,
  jpeg: EXPECTED_JPEG_DATAURL
};

describe('util - generateImage', function() {

  const svg = require('./diagram.svg'),
        outOfBoundsSVG = require('./out_of_bounds_diagram.svg'),
        webhookSVG = require('./webhook.svg');

  keys(expectedImagesByType).forEach(function(type) {

    it('should export <' + type + '>', async function() {

      const image = await generateImage(type, svg);

      expectToBeAnImage(image);
    });


    it('should automatically handle large images <' + type + '>', async function() {

      const image = await generateImage(type, outOfBoundsSVG);

      expectToBeAnImage(image);
    }).timeout(10000); // downscaling may exceed the default timeout 2000ms.


    it('should generate expected images <' + type + '>', async function() {

      const image = await generateImage(type, svg),
            expectedImage = expectedImagesByType[ type ];

      expect(image).to.be.eql(expectedImage);
    });


    it('should handle webhook icon <' + type + '>', async function() {

      const image = await generateImage(type, webhookSVG);

      expectToBeAnImage(image);
    });
  });

});


/**
 * If image cannot be generated properly it returns a data string with
 * 6 characters. If it is generated, image.length returns the actual size
 * of the generated image which is more than 6.
 */
function expectToBeAnImage(image) {
  expect(image).to.exist;
  expect(image.length).to.be.greaterThan(6);
}
