'use strict';

var lodash = require('lodash-node');
var async = require('async');

var Builder = function(factory) {
  this.factory = factory;
  this.changes = [];
  var sequenceWrapper = function(sequence) {
    return function() {
      return sequence.fn(sequence.counter++);
    };
  };
  var name;
  for (name in factory.sequences) {
    var sequence = factory.sequences[name];
    this.attr(name, sequenceWrapper(sequence));
  }
};

var resolveFunctions = function(object, lazyArray) {
  var setLazyValue = function(key, value, object, cb) {
    value.call(object, function(lazyVal) {
      object[key] = lazyVal;
      cb(null, object);
    });
  };
  for (var key in object) {
    var value = object[key];
    if (typeof value === 'function') {
      if (lazyArray && (value.length > 0)) {
        lazyArray.push(setLazyValue.bind(null, key, value));
      }
      else {
        object[key] = value.apply(object);
      }
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

var objectOrArray = function(count, fn) {
  if (count) {
    var objects = [];
    for (var i = 0; i < count; i++) {
      objects.push(fn());
    }
    return objects;
  } else {
    return fn();
  }
};

Builder.prototype.attributes = function(count) {
  var self = this;
  var attrSingle = function() {
    var object = mergeChanges(self.factory.template, self.changes);
    resolveFunctions(object, self.modeLazy ? self.lazyMethods : null);
    lodash.each(self.factory.afterAttributesCallbacks, function(callback) {
      object = callback.call(self, object) || object;
    });
    return object;
  };
  return objectOrArray(count, attrSingle);
};

Builder.prototype.build = function(count) {
  var self = this;
  var buildSingle = function() {
    var object = new self.factory.Constructor();
    lodash.assign(object, self.attributes());
    lodash.each(self.factory.afterBuildCallbacks, function(callback) {
      object = callback.call(self, object) || object;
    });
    return object;
  };
  return objectOrArray(count, buildSingle);
};

Builder.prototype.create = function(count, callback) {
  var self = this;
  if (!callback) {
    callback = count;
    count = undefined;
  }
  self.modeLazy = 1;
  self.lazyMethods = [];
  var create = function(object, cb) {

    var innerCreate = function(object, cb) {
      object.create(function(err, createdObj) {
        if (self.factory.afterCreateCallbacks.length) {

          var modifiedAfterCreateCallbacks = [function(cb) {
            cb(null, object, createdObj);
          }].concat(self.factory.afterCreateCallbacks);

          var creationCallbacks = lodash.map(modifiedAfterCreateCallbacks, function(innerCallback) {
            return function(obj, createdObj, cb) {
              innerCallback(obj, createdObj, function(err, innerObj, innerCreatedObj) {
                innerObj = innerObj || obj;
                innerCreatedObj = innerCreatedObj || createdObj;
                cb(err, innerObj, innerCreatedObj);
              });
            };
          });

          async.waterfall(creationCallbacks, function(err, object, createdObj) {
            cb(err, [object, createdObj]);
          });
        }
        else {
          cb(err, [object, createdObj]);
        }
      });
    };

    if (self.lazyMethods.length) {
      var lazyCallbackMethods = [function(cb) {
        cb(null, object);
      }].concat(self.lazyMethods);
      async.waterfall(lazyCallbackMethods, function(err, object) {
        innerCreate(object, cb);
      });
    } else {
      return innerCreate(object, cb);
    }
  };
  if (count) {
    async.map(self.build(count), create, function(err, data) {
      var objects = lodash.map(data, function(row) { return row[0]; });
      var createdObjs = lodash.map(data, function(row) { return row[1]; });
      callback(err, objects, createdObjs);
    });
  } else {
    create(self.build(), function(err, data) {
      var objects = data[0];
      var createdObjs = data[1];
      callback(err, objects, createdObjs);
    });
  }
};

Builder.prototype.reset = function() {
  lodash.each(this.factory.sequences, function(sequence) {
    sequence.counter = 0;
  });
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

Builder.prototype.extend = function(more) {
  this.changes.push(more);
  return this;
};

Builder.prototype.afterAttributes = function(cb) {
  this.factory.afterAttributesCallbacks.push(cb);
  return this;
};

Builder.prototype.afterBuild = function(cb) {
  this.factory.afterBuildCallbacks.push(cb);
  return this;
};

Builder.prototype.afterCreate = function(cb) {
  this.factory.afterCreateCallbacks.push(cb);
  return this;
};

module.exports = Builder;
