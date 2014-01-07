'use strict';

var should = require('should');

describe('apply method', function() {
  var apply = require('../lib/apply');

  it('should be defined', function() {
    should.exist(apply);
    apply.should.be.an.instanceof(Function);
  });

  it('should apply a simple template', function() {
    var template = {a: 1, b: 2, c: [1, 2, 3], d: { a: 'value' }};
    var obj = apply({}, template);
    obj.should.eql(template);
    obj.should.not.equal(template);
  });

});
