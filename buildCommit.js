'use strict';

const wrap = require('word-wrap');

/***
 * Optional config
 */

module.exports = function buildCommit(answers, config) {

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
    issues.forEach(function(issue){
      issue = issue.trim().substr(1)
      result += '[\#' + issue + '](' + config.repositoryBaseUrl + '/issues/' + issue + ')'
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
