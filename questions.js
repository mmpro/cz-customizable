'use strict';


const buildCommit = require('./buildCommit');
const log = require('winston');


const isNotWip = function(answers) {
  return answers.type.toLowerCase() !== 'wip';
};

module.exports = {

  getQuestions: function(config, cz) {

    // normalize config optional options
    config.scopeOverrides = config.scopeOverrides || {};

    const questions = [
      {
        type: 'list',
        name: 'type',
        message: 'Select the type of change that you\'re committing:',
        choices: config.types
      },
      {
        type: 'list',
        name: 'scope',
        message: '\nDenote the SCOPE of this change (optional):',
        choices: function(answers) {
          let scopes = [];
          if (config.scopeOverrides[answers.type]) {
            scopes = scopes.concat(config.scopeOverrides[answers.type]);
          }
          else {
            scopes = scopes.concat(config.scopes);
          }
          if (config.allowCustomScopes || scopes.length === 0) {
            scopes = scopes.concat([
              new cz.Separator(),
              { name: 'empty', value: false },
              { name: 'custom', value: 'custom' }
            ]);
          }
          return scopes;
        },
        when: function(answers) {
          let hasScope = false;
          if (config.scopeOverrides[answers.type]) {
            hasScope = !!(config.scopeOverrides[answers.type].length > 0);
          }
          else {
            hasScope = !!(config.scopes && (config.scopes.length > 0));
          }
          if (!hasScope) {
            answers.scope = 'custom';
            return false;
          }
          else {
            return isNotWip(answers);
          }
        }
      },
      {
        type: 'input',
        name: 'scope',
        message: 'Denote the SCOPE of this change:',
        when: function(answers) {
          return answers.scope === 'custom';
        }
      },
      {
        type: 'input',
        name: 'subject',
        message: 'Write a SHORT, IMPERATIVE tense description of the change:\n',
        validate: function(value) {
          return !!value
        }
      },
      {
        type: 'input',
        name: 'body',
        message: 'Provide a good LONGER description of the change. Use "|" to break new line:\n',
        validate: function(value) {
          return !!value;
        }
      },
      {
        type: 'input',
        name: 'relatedIssues',
        message: 'List any ISSUES RELATED to this change (optional). E.g.: #31, #34 - will be added to body:\n',
        when: isNotWip
      },
      {
        type: 'input',
        name: 'breaking',
        message: 'List any BREAKING CHANGES (optional):\n',
        when: function(answers) {
          if (config.allowBreakingChanges && config.allowBreakingChanges.indexOf(answers.type.toLowerCase()) >= 0) {
            return true;
          }
          return false; // no breaking changes allowed unless specifed
        }
      },
      {
        type: 'input',
        name: 'comitterInitials',
        message: 'Your initials please - they will become part of the changelog:\n',
        validate: function(value) {
          return !!value && value.length === 2
        }
      },
      /* our workflow does not allow closing issues by committing
      {
        type: 'input',
        name: 'footer',
        message: 'List any ISSUES RELATED to this change (optional). E.g.: #31, #34:\n',
        when: isNotWip
      },
      */
      {
        type: 'expand',
        name: 'confirmCommit',
        choices: [
          { key: 'y', name: 'Yes', value: 'yes' },
          { key: 'n', name: 'Abort commit', value: 'no' },
          { key: 'e', name: 'Edit message', value: 'edit' }
        ],
        message: function(answers) {
          const SEP = '###--------------------------------------------------------###';
          log.info('\n' + SEP + '\n' + buildCommit(answers) + '\n' + SEP + '\n');
          return 'Are you sure you want to proceed with the commit above?';
        }
      }
    ];

    return questions;
  }
};
