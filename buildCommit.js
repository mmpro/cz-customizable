'use strict';

const wrap = require('word-wrap');
const path = require('path');

const configFile = require('./readConfigFile');

module.exports = function buildCommit(answers) {

  const config = configFile()

  const maxLineWidth = 100;

  const wrapOptions = {
    trim: true,
    newline: '\n',
    indent:'',
    width: maxLineWidth
  };


  function addScope(scope) {
    if (!scope) return ': '; //it could be type === WIP. So there is no scope
    return '(' + scope.trim() + '): ';
  }

  function addSubject(subject) {
    return subject.trim();
  }

  function escapeSpecialChars(result) {
    const specialChars = ['\`'];

    specialChars.map(function (item) {
      // For some strange reason, we have to pass additional '\' slash to commitizen. Total slashes are 4.
      // If user types "feat: `string`", the commit preview should show "feat: `\\string\\`".
      // Don't worry. The git log will be "feat: `string`"
      result = result.replace(new RegExp(item, 'g'), '\\\\`');
    });
    return result;
  }

  // Hard limit this line
  let head = (answers.type + addScope(answers.scope) + addSubject(answers.subject)).slice(0, maxLineWidth);
  if (answers.comitterInitials) {
    head += ' | ' + answers.comitterInitials
  }

  // Wrap these lines at 100 characters
  let body = wrap(answers.body, wrapOptions) || '';
  let bodyLines = body.split('|').length
  body = body.split('|').join('\n');

  const breaking = wrap(answers.breaking, wrapOptions);
  const footer = wrap(answers.footer, wrapOptions);

  let result = head;
  if (body) {
    result += '\n\n' + body;
  }
  if (answers.relatedIssues) {
    if (bodyLines > 1) {
      result += '\nRelated: '
    }
    else {
      result += ' - related: '
    }
    let issues = answers.relatedIssues.split(',')
    // e.g. #320, mmpro/ac-client#123
    issues.forEach(function(issue) {
      issue = issue.trim()
      let url = config.repository.baseUrl
      if (issue.indexOf('#') === 0) {
        // this repo
        issue = issue.substr(1)
        url += config.repository.repoUrl + 'issues/' + issue
      }
      else {
        // other/external repo - e.g. mmpro/ac-client#123
        let parts = issue.split('#')
        issue = parts[1]
        url += parts[0] + '/issues/' + issue
      }
      result += '[\#' + issue + '](' + url + ')'
    })
  }

  if (breaking) {
    result += '\n\n' + 'BREAKING CHANGE:\n' + breaking;
  }
  if (footer) {
    result += '\n\nClosed: ' + footer;
  }

  return escapeSpecialChars(result);
};
