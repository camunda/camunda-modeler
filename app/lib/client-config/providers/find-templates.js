'use strict';

var fs = require('fs');

var glob = require('glob');

var isArray = require('lodash/lang/isArray');


/**
 * Finds templates under given search paths.
 *
 * @param  {Array<String>} searchPaths
 *
 * @return {Array<TemplateDescriptor>}
 */
module.exports = function findTemplates(searchPaths) {

  var allTemplates = searchPaths.reduce(function(templates, path) {

    var files;

    // treat globbing errors as warnings to
    // gracefully handle permission / file not found errors
    try {
      files = globTemplates(path);
    } catch (err) {
      console.log('[WARN] templates glob error', err);

      return templates;
    }

    return files.reduce(function(templates, filePath) {
      try {
        var parsedTemplates = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (!isArray(parsedTemplates)) {
          parsedTemplates = [ parsedTemplates ];
        }

        return [].concat(templates, parsedTemplates);
      } catch (err) {
        console.log('[ERROR] template <' + filePath + '> parse error', err);

        throw new Error('template ' + filePath + ' parse error: ' + err.message);
      }
    }, templates);
  }, []);

  return allTemplates;
};



//////////// helpers ///////////////////////////////////////////

/**
 * Locate element templates in 'element-templates'
 * sub directories local to given path.
 *
 * @param {String} path
 *
 * @return {Array<String>} found templates.
 */
function globTemplates(path) {

  var globOptions = {
    cwd: path,
    nodir: true,
    realpath: true
  };

  return glob.sync('element-templates/**/*.json', globOptions);
}