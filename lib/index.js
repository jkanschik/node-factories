'use strict';

var Builder = require('./builder');

var Factories;
var globalSequences = {};

var Factory = function(name, constructor, template) {
  this.name = name;
  this.Constructor = constructor;
  this.template = template || {};
  this.sequences = {};
  this.traits = {};

  this.afterAttributesCallbacks = [];
  this.afterBuildCallbacks = [];
  this.afterCreateCallbacks = [];
};

/**
 * Defines a sequence on this factory.
 *
 * @param {string} name The name of the sequence, dot notation is supported.
 * @param {function} fn A converter for the counter.
 */
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

Factory.prototype.trait = function(traitName, template) {
  this.traits[traitName] = template;
  var self = this;
  var newName = traitName + this.name.charAt(0).toUpperCase() + this.name.slice(1);
  Object.defineProperty(Factories, newName, {
    get: function() {
      return new Builder(self).trait(traitName);
    }
  });
  return this;
};

Factory.prototype.afterAttributes = function(cb) {
  this.afterAttributesCallbacks.push(cb);
  return this;
};

Factory.prototype.afterBuild = function(cb) {
  this.afterBuildCallbacks.push(cb);
  return this;
};

Factory.prototype.afterCreate = function(cb) {
  this.afterCreateCallbacks.push(cb);
  return this;
};

/**
 * Factories provides the API of node-factories.
 */
Factories = function() {};

/**
 * Defines a new factory with the given name and adds an accessor to the Factories object for the new factory.
 *
 * @param {string} name The name of the factory.
 * @param {class} constructor If given, the factory creates instances of this constructor.
 * @param {object} template A template for the object to be created.
 */
Factories.define = function(name, constructor, template) {
  // fail fast if a factory with this name has already been defined.
  if (Factories[name]) {
    throw new Error('Factory ' + name + ' already defined!');
  }

  if (!template) {
    template = constructor;
    constructor = Object;
  }
  var factory = new Factory(name, constructor, template);
  Object.defineProperty(Factories, name, {
    get: function() {
      return new Builder(factory);
    }
  });
  return factory;
};

/**
 * Defines a new factory and returns it without adding an accessor to Factories (anonymous factories).
 *
 * @param {class} constructor If given, the factory creates instances of this constructor.
 * @param {object} template A template for the object to be created.
 */
Factories.build = function(constructor, template) {
  if (!template) {
    template = constructor;
    constructor = Object;
  }
  return new Builder(new Factory('anonymous', constructor, template));
};

/**
 * Defines a new global sequence, which can be used when defining new factories.
 * Each sequence has a unique, global name and a mandatory converter function,
 * which is used to convert the counter of the sequence.
 *
 * @param {string} name The name of the sequence for later reference.
 * @param {function} fn A converter; it has one parameter, the counter of the sequence.
 */
Factories.sequence = function(name, fn) {
  globalSequences[name] = {
    counter: 0,
    fn: fn
  };
};

module.exports = Factories;
