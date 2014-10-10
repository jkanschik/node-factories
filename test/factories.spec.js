'use strict';
require('should');
var factories = require('../lib');

var User = function() {};
User.prototype.upperName = function() { return this.name.toUpperCase(); };
User.prototype.create = function(cb) {
  process.nextTick(cb);
};

factories.define('user', {name: 'user name'});
factories.define('userWithConstructor', User, {name: 'user name'});

describe('Definition of factories', function() {

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
  
  describe('attributes(count)', function() {

    it('creates an object even if there is a constructor', function() {
      var user = factories.userWithConstructor.attributes();
      user.name.should.equal('user name');
      user.should.not.be.instanceOf(User);
    });

    it('creates an array of objects using the constructor if a number is passed', function() {
      var users = factories.userWithConstructor.attributes(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].name.should.equal('user name');
        users[i].should.not.be.an.instanceOf(User);
      }
    });

    it('creates an object based on the factory configuration', function() {
      var user = factories.user.attributes();
      user.name.should.equal('user name');
    });

    it('creates an array of objects if a number is passed', function() {
      var users = factories.user.attributes(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].name.should.equal('user name');
        users[i].should.not.be.an.instanceOf(User);
      }
    });

  });

  describe('build(count)', function() {

    it('creates an object using the given constructor', function() {
      var user = factories.userWithConstructor.build();
      user.should.be.instanceOf(User);
      user.name.should.equal('user name');
      user.upperName().should.equal('USER NAME');
    });

    it('creates an array of objects using the constructor if a number is passed', function() {
      var users = factories.userWithConstructor.build(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].name.should.equal('user name');
        users[i].should.be.an.instanceOf(User);
      }
    });
 
    it('creates an object based on the factory configuration', function() {
      var user = factories.user.build();
      user.should.be.instanceOf(Object);
      user.name.should.equal('user name');
    });

    it('creates an array of objects if a number is passed', function() {
      var users = factories.user.build(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].should.be.an.instanceOf(Object);
      }
    });

  });

  describe('create(count)', function() {

    it('creates an object and calls the .create() method on the object', function(done) {
      factories.userWithConstructor.create(function(err, user) {
        user.should.be.instanceOf(User);
        user.name.should.equal('user name');
        user.upperName().should.equal('USER NAME');
        done(err);
      });
    });

    it('creates an array of objects and calls the .create() method on each object if a number is passed', function(done) {
      factories.userWithConstructor.create(5, function(err, users) {
        users.should.be.an.instanceOf(Array);
        users.length.should.equal(5);
        for (var i in users) {
          users[i].name.should.equal('user name');
          users[i].should.be.an.instanceOf(User);
        }
        done(err);
      });
    });

  });

  describe('anonymous Factories.build no constructor', function() {
      var user_factory = factories.build({name: 'anonymous factory user'});
      var user = user_factory.attributes();
      user.should.not.be.instanceOf(User);
      user.name.should.equal('anonymous factory user');
  });

  describe('anonymous Factories.build attributes', function() {
      var user_factory = factories.build(User,{name: 'anonymous factory user'});
      var user = user_factory.attributes();
      user.should.not.be.instanceOf(User);
      user.name.should.equal('anonymous factory user');
  });

  describe('anonymous Factories.build', function() {
      var user_factory = factories.build(User,{name: 'anonymous factory user'});
      var user = user_factory.build();
      user.should.be.instanceOf(User);
      user.name.should.equal('anonymous factory user');
      user.upperName().should.equal('ANONYMOUS FACTORY USER');
  });

  describe('attr(String, Object)', function() {

    it('overwrites predefined values', function() {
      var user = factories.user.attr('name', 'other value').build();
      user.name.should.equal('other value');
    });

    it('changes only the object which is currently built', function() {
      var willy = factories.user.attr('name', 'Willy').build();
      var martha = factories.user.attr('name', 'Martha').build();
      var user = factories.user.build();
      willy.name.should.equal('Willy');
      martha.name.should.equal('Martha');
      user.name.should.equal('user name');
    });

    it('is chainable', function() {
      var willy = factories.user
        .attr('name', 'Willy')
        .attr('age', 25)
        .build();
      willy.name.should.equal('Willy');
      willy.age.should.equal(25);
    });

    it('can be used to overwrite nested attributes using dot notation', function() {
      factories.define('NestedDot', {level: 1, nested: {level: 2, nested: {level: 3}}});
      factories.NestedDot
        .attr('nested.nested.level', 4).build()
        .nested.nested.level.should.equal(4);
    });

  });

});

describe('Traits', function() {
  before(function() {
    factories.define('userWithTraits', {name: 'user name'})
      .trait('admin', {isAdmin: true})
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

  xit('can be built with syntactic sugar for combined traites', function() {
    var femaleAdmin = factories.femaleAdminUserWithTraits.build();
    femaleAdmin.gender.should.equal('female');
    femaleAdmin.isAdmin.should.be(true);
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

  it('can be used for nested attributes using dot notation', function() {
    factories
      .define('withNestedSequence', {})
      .sequence('nested.name', function(i) {return 'Person_' + i;});
    factories.withNestedSequence.build()
      .nested.name.should.equal('Person_0');
    factories.withNestedSequence.build()
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

describe('References to other factories', function() {
  xit('is possible to refer to another factory in a factory definition', function() {
    factories.define('Article', {
      title: 'Some article',
      author: factories.user
    });
    var article = factories.Article.build();
    article.author.name.should.equal('user name');
  });
});

describe('Inheritance of factories', function() {

});

describe('Extending objects', function() {
  
  describe('attributes(count)', function() {

    it('extends an object, attributes unaltered', function() {
      var user = factories.userWithConstructor.attributes();
      var extended_user = factories.userWithConstructor.extend({name: 'extended user name'}).attributes();
      user.name.should.equal('user name');
      extended_user.name.should.equal('extended user name');
      user.should.not.be.instanceOf(User);
    });

    it('extends an array of objects using the constructor if a number is passed', function() {
      var users = factories.userWithConstructor.attributes(5);
      var extended_users = factories.userWithConstructor.extend({name: 'extended user name'}).attributes(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].name.should.equal('user name');
        users[i].should.not.be.an.instanceOf(User);
      }
      extended_users.should.be.an.instanceOf(Array);
      extended_users.length.should.equal(5);
      for (var i in extended_users) {
        extended_users[i].name.should.equal('extended user name');
        extended_users[i].should.not.be.an.instanceOf(User);
      }
    });
  });

  describe('build(count)', function() {

    it('creates an object using the given constructor', function() {
      var user = factories.userWithConstructor.build();
      var extended_user = factories.userWithConstructor.extend({name: 'extended user name'}).build();
      user.should.be.instanceOf(User);
      user.name.should.equal('user name');
      extended_user.should.be.instanceOf(User);
      extended_user.name.should.equal('extended user name');
      user.upperName().should.equal('USER NAME');
      extended_user.upperName().should.equal('EXTENDED USER NAME');
    });

    it('creates an array of objects using the constructor if a number is passed', function() {
      var users = factories.userWithConstructor.build(5);
      var extended_users = factories.userWithConstructor.extend({name: 'extended user name'}).build(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].name.should.equal('user name');
        users[i].should.be.an.instanceOf(User);
      }
      extended_users.should.be.an.instanceOf(Array);
      extended_users.length.should.equal(5);
      for (var i in extended_users) {
        extended_users[i].name.should.equal('extended user name');
        extended_users[i].should.be.an.instanceOf(User);
      }
    });
  });

  describe('extend suppresses lazy behavior', function() {
    var count = 0;
    factories.define('extendWithFunction', {lazy: function() { count++; return count; }});
    count.should.equal(0);
    var obj_extended = factories.extendWithFunction.extend({lazy: function() { return 42; } }).build();
    var obj_extended2 = factories.extendWithFunction.extend({lazy: 84 }).build();
    obj_extended.should.eql({lazy: 42});
    obj_extended2.should.eql({lazy: 84});
    count.should.equal(0);
    var obj1 = factories.extendWithFunction.build();
    var obj2 = factories.extendWithFunction.build();
    obj1.should.eql({lazy: 1});
    obj2.should.eql({lazy: 2});
    count.should.equal(2);

  });

});
