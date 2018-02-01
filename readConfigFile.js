'use strict';

const findConfig = require('find-config');
const path = require('path');
const log = require('winston');

/* istanbul ignore next */
module.exports = function() {

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
