'use strict';

var Builder = function(constructor, template) {
  this.Constructor = constructor;
  this.template = template;
  this.attrOverwrite = {};
};


var build = function(Constructor, template, overwrites) {

  var applyValue = function(obj, attr, value) {
    if (typeof value === 'function') {
      obj[attr] = value();
      return;
    }
    if (typeof value === 'object') {
      obj[attr] = build(Object, template[attr], overwrites && overwrites[attr]);
    } else {
      obj[attr] = value;
    }
  };

  var obj = new Constructor();
  for (var attr in template) {
    applyValue(obj, attr, (overwrites && overwrites[attr]) || template[attr]);
  }
  for (attr in overwrites) {
    if (!template[attr]) {
      applyValue(obj, attr, overwrites[attr]);
    }
  }
  return obj;
};

Builder.prototype.build = function(count) {
  if (count && 'number' === typeof count) {
    var objects = [];
    for (var i = 0; i < count; i++) {
      objects.push(build(this.Constructor, this.template, this.attrOverwrite));
    }
    return objects;
  } else {
    return build(this.Constructor, this.template, this.attrOverwrite);
  }
};

Builder.prototype.attr = function(name, value) {
  this.attrOverwrite[name] = value;
  return this;
};

var Factory = function() {};

Factory.define = function(name, constructor, template) {
  if (!template) {
    template = constructor;
    constructor = Object;
  }
  Object.defineProperty(Factory, name, {
    get: function() {
      return new Builder(constructor, template);
    }
  });
};

module.exports = Factory;
