var sharedOperaConfig = require('../shared/karma-opera.conf.js');

module.exports = function(config){

  var file = ['../../test-karma/async-test.js'];

  sharedOperaConfig(config);

  config.files = config.files.concat(file);
  
}