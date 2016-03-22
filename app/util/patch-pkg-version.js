'use strict';

var fs = require('fs');

var PKG_JSON_PATH = __dirname + '/../../package.json';

var ENCODING_UTF8 = 'utf8';

/**
 * Patch the `package.json` version of the library
 * on disc.
 *
 * @param {String} pkgVersion
 */
module.exports = function(pkgVersion) {

  var pkgString = fs.readFileSync(PKG_JSON_PATH, ENCODING_UTF8);

  pkgString = pkgString.replace(/"version": "[^"]+"/, '"version": "' + pkgVersion + '"');

  fs.writeFileSync(PKG_JSON_PATH, pkgString, ENCODING_UTF8);
};