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

// Definition of factories
Factories = function() {};

Factories.define = function(name, constructor, template) {
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

Factories.build = function(constructor, template) {
  if (!template) {
    template = constructor;
    constructor = Object;
  }
  return new Builder(new Factory('anonymous', constructor, template));
};

Factories.sequence = function(name, fn) {
  globalSequences[name] = {
    counter: 0,
    fn: fn
  };
};

module.exports = Factories;
