'use strict';
require('should');
var factories = require('../lib');

describe('Definition of factories', function() {

  it('creates objects using the given constructor', function() {
    var User = function() {};
    User.prototype.upperName = function() { return this.name.toUpperCase(); };
    factories.define('userWithConstructor', User, {name: 'user name'});
    var user = factories.userWithConstructor.build();
    user.should.be.instanceOf(User);
    user.name.should.equal('user name');
    user.upperName().should.equal('USER NAME');
  });

  it('can be nested in arbitrary depth', function() {
    var template = {level: 1, nested: {level: 2, nested: {level: 3}}};
    factories.define('Nested', template);
    factories.Nested.build().should.eql(template);
  });

  it('accepts functions for lazy loading', function() {
    var count = 0;
    factories.define('withFunction', {lazy: function() { count++; return count; }});
    count.should.equal(0);
    var obj1 = factories.withFunction.build();
    var obj2 = factories.withFunction.build();
    obj1.should.eql({lazy: 1});
    obj2.should.eql({lazy: 2});
    count.should.equal(2);
  });

  it('accepts functions in nested objects as well', function() {
    var count = 0;
    factories.define('nestedWithFunction', {nested: {lazy: function() { count++; return count; }}});
    count.should.equal(0);
    var obj1 = factories.nestedWithFunction.build();
    var obj2 = factories.nestedWithFunction.build();
    obj1.should.eql({nested: {lazy: 1}});
    obj2.should.eql({nested: {lazy: 2}});
    count.should.equal(2);
  });

  it('can be defined without template', function() {
    factories.define('withoutTemplate');
    factories.withoutTemplate.build().should.eql({});
  });
});

describe('Building objects', function() {
  
  before(function() {
    factories.define('User', {name: 'User name'});
  });


  describe('build(count)', function() {

    it('creates an object based on the factory configuration', function() {
      var user = factories.User.build();
      user.name.should.equal('User name');
    });

    it('creates an array of objects if a number is passed', function() {
      var users = factories.User.build(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
    });

  });

  describe('attr(String, Object)', function() {

    it('overwrites predefined values', function() {
      var user = factories.User.attr('name', 'other value').build();
      user.name.should.equal('other value');
    });

    it('changes only the object which is currently built', function() {
      var willy = factories.User.attr('name', 'Willy').build();
      var martha = factories.User.attr('name', 'Martha').build();
      var user = factories.User.build();
      willy.name.should.equal('Willy');
      martha.name.should.equal('Martha');
      user.name.should.equal('User name');
    });

    it('is chainable', function() {
      var willy = factories.User
        .attr('name', 'Willy')
        .attr('age', 25)
        .build();
      willy.name.should.equal('Willy');
      willy.age.should.equal(25);
    });

    xit('can be used to overwrite nested attributes using dot notation', function() {
      factories.define('NestedDot', {level: 1, nested: {level: 2, nested: {level: 3}}});
      factories.NestedDot
        .attr('nested.nested.level', 4).build()
        .nested.nested.level.should.equal(4);

    });

  });

});

xdescribe('Traits', function() {
  before(function() {
    factories.define('userWithTraits', {name: 'user name'})
      .trait('male', {gender: 'male', name: 'Willy'})
      .trait('female', {gender: 'female', name: 'Martha'});
  });

  it('can be built using .trait(name)', function() {
    factories.userWithTraits.trait('male').build()
      .should.eql({gender: 'male', name: 'Willy'});
    factories.userWithTraits.trait('female').build()
      .gender.should.equal('female');
  });

  it('can be built with syntactic sugar', function() {
    factories.maleUserWithTraits.build()
      .should.eql({gender: 'male', name: 'Willy'});
    factories.femaleUserWithTraits.build()
      .gender.should.equal('female');
  });

});

describe('Sequences', function() {

  it('should start with 0 and increase on every build()', function() {
    factories
      .define('withSequence', {})
      .sequence('name', function(i) {return 'Person_' + i;});
    factories.withSequence.build()
      .name.should.equal('Person_0');
    factories.withSequence.build()
      .name.should.equal('Person_1');
    factories.withSequence.build(10)[9]
      .name.should.equal('Person_11');
  });

  xit('can be used for nested attributes using dot notation', function() {
    factories
      .define('withNestedSequence', {})
      .sequence('nested.name', function(i) {return 'Person_' + i;});
    factories.withSequence.build()
      .nested.name.should.equal('Person_0');
    factories.withSequence.build()
      .nested.name.should.equal('Person_1');
  });

  it('can be defined globally for all factories', function() {
    factories.sequence('nameOfSequence', function(i) {return i;});
    factories
      .define('withGlobalSequence')
      .sequence('nameOfSequence');
    factories.withGlobalSequence.build()
      .nameOfSequence.should.equal(0);
    factories.withGlobalSequence.build()
      .nameOfSequence.should.equal(1);
  });
});

describe('Inheritance of factories', function() {

});