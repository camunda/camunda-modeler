

module.exports.setup = function(config, done) {



function setupWindows(exePath) {
  var query = winUtil.queryRegistry().toString(),
      escapedExePath = exePath.replace(/\\/g, '\\\\');

  var hasExePath = new RegExp(escapedExePath, 'ig').test(query);
  var hasNoKey = new RegExp('The system was unable to find the specified registry key or value\.', 'gi').test(query);

  // Prompt user for file association, whenever:
  // - we cant't find association
  //  if exePath doesn't match
  // - check config file

  if (hasNoKey || !hasExePath) {
    loadConfigFile(function(config) {
      if (config && config.fileAssociation === false) {
        return;
      }

      suggestFileAssociation(exePath);
    });
  }

  var config,
      fileAssociationKey = 'fileAssociation';

  needsAssociation(config[fileAssociationKey], function(err, associate) {

    if (associate) {

      associateEditor(exePath, function(err) {
        // haha, don't care
      });
    }

    config.update(fileAssociationKey, associate);
  });


  function needsAssociation(existingChoice, done) {

    if (existingChoice !== undefined) {
      return done(null, existingChoice);
    } else {
      suggestFileAssociation(done);
    }
  }

  function associateEditor(exePath, done) {

    try {
      winUtil.addToRegistry(exePath);
    } catch (e) {
      return done(e);
    }

    done(null);
  }
}

function suggestFileAssociation(done) {
  promptUser('Do you want to associate your .bpmn files to the Camunda Modeler ?', done);
}

function promptUser(message, callback) {
  dialog.showMessageBox({
    type: 'question',
    buttons: [ 'Yes', 'No' ],
    title: 'Camunda Modeler',
    message: message
  }, function(answer) {
    // return true, if the user agreed
    callback(null, answer === 0);
  });
}

function persistAnswer(answer) {
  loadConfigFile(function(config, configPath) {
    if (!config) {
      fs.writeFile(configPath, JSON.stringify({ fileAssociation: answer }), { encoding: 'utf8' }, function() {});
    }
  });
}

};