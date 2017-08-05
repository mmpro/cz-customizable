'use strict';

// Inspired by: https://github.com/commitizen/cz-conventional-changelog and https://github.com/commitizen/cz-cli
const findConfig = require('find-config');
const log = require('winston');
const editor = require('editor');
const temp = require('temp').track();
const fs = require('fs');
const path = require('path');
const buildCommit = require('./buildCommit');
const configFile = require('./readConfigFile');

module.exports = {

  prompter: function(cz, commit) {
    const config = configFile();

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
    })
  }
};
