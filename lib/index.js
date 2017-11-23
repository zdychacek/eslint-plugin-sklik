'use strict';

module.exports.rules = {
  'deprecated': require('./rules/deprecated'),
};

module.exports.configs = {
  recommended: {
    rules: {
      'sklik/deprecated': [ 1 ],
    },
  },
};
