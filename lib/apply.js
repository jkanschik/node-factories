'use strict';

var apply = function(obj, template, traits, overwrites) {

  var applyValue = function(o, attr, value) {
    if (typeof value === 'function') {
      o[attr] = value();
      return;
    }
    if (typeof value === 'object') {
      o[attr] = apply({}, template[attr], traits && traits[attr], overwrites && overwrites[attr]);
    } else {
      o[attr] = value;
    }
  };

  for (var attr in template) {
    applyValue(obj, attr, (traits && traits[attr]) || (overwrites && overwrites[attr]) || template[attr]);
  }
  for (attr in traits) {
    if (!template[attr]) {
      applyValue(obj, attr, traits[attr]);
    }
  }
  for (attr in overwrites) {
    if (!template[attr]) {
      applyValue(obj, attr, overwrites[attr]);
    }
  }
  return obj;

};

module.exports = apply;
