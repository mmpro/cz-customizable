'use strict';

// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli
const findConfig = require('find-config');
const log = require('winston');
const editor = require('editor');
const temp = require('temp').track();
const fs = require('fs');
const path = require('path');
const buildCommit = require('./buildCommit');


/* istanbul ignore next */
function readConfigFile() {

  // First try to find config block in the nearest package.json
  const pkg = findConfig.require('package.json', {home: false});
  if (pkg) {
    let pkgPath
    if (pkg.config && pkg.config['cz-customizable'] && pkg.config['cz-customizable'].config) {
      pkgPath = path.resolve(pkg.config['cz-customizable'].config);
      console.info('>>> Using cz-customizable config specified in your package.json: ', pkgPath);
    }
    else {
      // fallback to module's config
      pkgPath = './czConfig.js';
    }
    return require(pkgPath);
  }
  log.warn('Unable to find a configuration file. Please refer to documentation to learn how to ser up: https://github.com/leonardoanalista/cz-customizable#steps "');
}


module.exports = {

  prompter: function(cz, commit) {
    const config = readConfigFile();

    log.info('\n\nLine 1 will be cropped at 100 characters. All other lines will be wrapped after 100 characters.\n');

    const questions = require('./questions').getQuestions(config, cz);

    cz.prompt(questions).then(function(answers) {
      if (answers.confirmCommit === 'edit') {
        temp.open(null, function(err, info) {
          /* istanbul ignore else */
          if (!err) {
            fs.write(info.fd, buildCommit(answers));
            fs.close(info.fd, function(err) {
              editor(info.path, function (code, sig) {
                if (code === 0) {
                  const commitStr = fs.readFileSync(info.path, { encoding: 'utf8' });
                  commit(commitStr);
                }
                else {
                  log.info('Editor returned non zero value. Commit message was:\n' + buildCommit(answers));
                }
              });
            });
          }
        });
      }
      else if (answers.confirmCommit === 'yes') {
        commit(buildCommit(answers));
      }
      else {
        log.info('Commit has been canceled.');
      }
    });
  }
};
