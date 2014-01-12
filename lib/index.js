'use strict';

var lodash = require('lodash-node');
var async = require('async');

var Builder, Factory, Factories;

var globalSequences = {};


Builder = function(factory) {
  this.factory = factory;
  this.changes = [];

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

var resolveFunctions = function(object) {
  for (var key in object) {
    var value = object[key];
    if (typeof value === 'function') {
      object[key] = value();
    } else if (typeof value === 'object') {
      resolveFunctions(object[key]);
    }
  }
};

var mergeChanges = function(template, changes) {
  var object = {};
  lodash.assign(object, lodash.cloneDeep(template));
  for (var i in changes) {
    lodash.assign(object, lodash.cloneDeep(changes[i]));
  }
  return object;
};

Builder.prototype.attributes = function(count) {
  var self = this;
  var attrSingle = function() {
    var object = mergeChanges(self.factory.template, self.changes);
    resolveFunctions(object);
    return object;
  };

  if (count) {
    var objects = [];
    for (var i = 0; i < count; i++) {
      objects.push(attrSingle());
    }
    return objects;
  } else {
    return attrSingle();
  }

};

Builder.prototype.build = function(count) {
  var self = this;
  var buildSingle = function() {
    var object = new self.factory.Constructor();
    lodash.assign(object, self.attributes());
    return object;
  };

  if (count) {
    var objects = [];
    for (var i = 0; i < count; i++) {
      objects.push(buildSingle());
    }
    return objects;
  } else {
    return buildSingle();
  }
};

Builder.prototype.create = function(count, callback) {
  if (!callback) {
    callback = count;
    count = undefined;
  }
  var create = function(object, cb) {
    object.create(function(err) {
      cb(err, object);
    });
  };
  if (count) {
    async.map(this.build(count), create, callback);
  } else {
    create(this.build(), callback);
  }
};

var resolveDotNotation = function(name, value) {
  return name.split('.').reduceRight(function(object, key) {
    var o = {};
    o[key] = object;
    return o;
  }, value);
};

Builder.prototype.attr = function(name, value) {
  this.changes.push(resolveDotNotation(name, value));
  return this;
};

Builder.prototype.trait = function(name) {
  this.changes.push(this.factory.traits[name]);
  return this;
};

Factory = function(constructor, template) {
  this.Constructor = constructor;
  this.template = template || {};
  this.sequences = {};
  this.traits = {};
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

Factory.prototype.trait = function(name, template) {
  this.traits[name] = template;
  return this;
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
