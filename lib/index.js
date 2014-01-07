'use strict';

var Builder, Factory, Factories;

var globalSequences = {};


Builder = function(factory) {
  this.factory = factory;
  this.attrOverwrite = {};

  var sequenceWrapper = function(sequence) {
    return function() {
      return sequence.fn(sequence.counter++);
    };
  };
  var name, sequence;
  for (name in factory.sequences) {
    sequence = factory.sequences[name];
    this.attr(name, sequenceWrapper(sequence));
  }
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
      objects.push(build(this.factory.Constructor, this.factory.template, this.attrOverwrite));
    }
    return objects;
  } else {
    return build(this.factory.Constructor, this.factory.template, this.attrOverwrite);
  }
};

Builder.prototype.attr = function(name, value) {
  this.attrOverwrite[name] = value;
  return this;
};



Factory = function(constructor, template) {
  this.Constructor = constructor;
  this.template = template || {};
  this.sequences = {};
};

Factory.prototype.sequence = function(name, fn) {
  if (fn) {
    this.sequences[name] = {
      counter: 0,
      fn: fn
    };
  } else {
    this.sequences[name] = globalSequences[name];
  }
};




Factories = function() {};

Factories.define = function(name, constructor, template) {
  if (!template) {
    template = constructor;
    constructor = Object;
  }
  var factory = new Factory(constructor, template);
  Object.defineProperty(Factories, name, {
    get: function() {
      return new Builder(factory);
    }
  });
  return factory;
};

Factories.sequence = function(name, fn) {
  globalSequences[name] = {
    counter: 0,
    fn: fn
  };
};

module.exports = Factories;
