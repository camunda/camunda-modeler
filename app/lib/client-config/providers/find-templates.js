const fs = require('fs');

const glob = require('glob');

const {
  isArray
} = require('min-dash');

const log = require('../../log')('app:client-config:element-templates');


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
      log.error('glob failed', err);

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
        log.error('failed to parse template %s', filePath, err);

        throw new Error('template ' + filePath + ' parse error: ' + err.message);
      }
    }, templates);
  }, []);

  return allTemplates;
};



// helpers //////////////////

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