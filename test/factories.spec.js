'use strict';
require('should');
var factories = require('../lib');

var User = function() {};
User.prototype.upperName = function() { return this.name.toUpperCase(); };
User.prototype.create = function(cb) {
  var self = this;
  process.nextTick(function() {
    var newUser = self;
    newUser.built = 1;
    cb(null, newUser);
  });
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

    it('creates an array of objects and calls .create() method on each object if a number is passed', function(done) {
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
    var userFactory = factories.build({name: 'anonymous factory user'});
    var user = userFactory.attributes();
    user.should.not.be.instanceOf(User);
    user.name.should.equal('anonymous factory user');
  });

  describe('anonymous Factories.build attributes', function() {
    var userFactory = factories.build(User, {name: 'anonymous factory user'});
    var user = userFactory.attributes();
    user.should.not.be.instanceOf(User);
    user.name.should.equal('anonymous factory user');
  });

  describe('anonymous Factories.build', function() {
    var userFactory = factories.build(User, {name: 'anonymous factory user'});
    var user = userFactory.build();
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

  it('can be reset', function() {
    factories
      .define('withSequenceAndReset', {})
      .sequence('name', function(i) {return 'Person_' + i;});
    factories.withSequenceAndReset.build()
      .name.should.equal('Person_0');
    factories.withSequenceAndReset.build()
      .name.should.equal('Person_1');
    factories.withSequenceAndReset.build(10)[9]
      .name.should.equal('Person_11');
    factories.withSequenceAndReset.reset();
    factories.withSequenceAndReset.build()
      .name.should.equal('Person_0');
    factories.withSequenceAndReset.build()
      .name.should.equal('Person_1');
    factories.withSequenceAndReset.build(10)[9]
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
  it('can reset globally', function() {
    factories.sequence('nameOfSequence', function(i) {return i;});
    factories
      .define('withGlobalSequenceAndReset')
      .sequence('nameOfSequence');
    factories.withGlobalSequenceAndReset.build()
      .nameOfSequence.should.equal(0);
    factories.withGlobalSequenceAndReset.build()
      .nameOfSequence.should.equal(1);
    factories.withGlobalSequenceAndReset.reset();
    factories.withGlobalSequenceAndReset.build()
      .nameOfSequence.should.equal(0);
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

describe('Lazy creation', function() {
  it('allows attributes to be set lazily when .create() is used', function(done) {

    factories.define('LazyTest', User, {
      a: 3,
      b: function() { return 4; },
      c: function(cb) { return cb && cb(5); }
    });

    factories.LazyTest.create(function(err, obj, created) {
      created.a.should.eql(3);
      created.b.should.eql(4);
      created.c.should.eql(5);
      created.built.should.eql(1);
      done();
    });

  });
});

describe('Inheritance of factories', function() {

});

describe('Extending objects', function() {
  describe('attributes(count)', function() {

    it('extends an object, attributes unaltered', function() {
      var user = factories.userWithConstructor.attributes();
      var extendedUser = factories.userWithConstructor.extend({name: 'extended user name'}).attributes();
      user.name.should.equal('user name');
      extendedUser.name.should.equal('extended user name');
      user.should.not.be.instanceOf(User);
    });

    it('extends an array of objects using the constructor if a number is passed', function() {
      var users = factories.userWithConstructor.attributes(5);
      var extendedUsers = factories.userWithConstructor.extend({name: 'extended user name'}).attributes(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].name.should.equal('user name');
        users[i].should.not.be.an.instanceOf(User);
      }
      extendedUsers.should.be.an.instanceOf(Array);
      extendedUsers.length.should.equal(5);
      for (var j in extendedUsers) {
        extendedUsers[j].name.should.equal('extended user name');
        extendedUsers[j].should.not.be.an.instanceOf(User);
      }
    });
  });

  describe('build(count)', function() {

    it('creates an object using the given constructor', function() {
      var user = factories.userWithConstructor.build();
      var extendedUser = factories.userWithConstructor
        .extend({name: 'extended user name'})
        .build();
      user.should.be.instanceOf(User);
      user.name.should.equal('user name');
      extendedUser.should.be.instanceOf(User);
      extendedUser.name.should.equal('extended user name');
      user.upperName().should.equal('USER NAME');
      extendedUser.upperName().should.equal('EXTENDED USER NAME');
    });

    it('creates an array of objects using the constructor if a number is passed', function() {
      var users = factories.userWithConstructor.build(5);
      var extendedUsers = factories.userWithConstructor
        .extend({name: 'extended user name'})
        .build(5);
      users.should.be.an.instanceOf(Array);
      users.length.should.equal(5);
      for (var i in users) {
        users[i].name.should.equal('user name');
        users[i].should.be.an.instanceOf(User);
      }
      extendedUsers.should.be.an.instanceOf(Array);
      extendedUsers.length.should.equal(5);
      for (var j in extendedUsers) {
        extendedUsers[j].name.should.equal('extended user name');
        extendedUsers[j].should.be.an.instanceOf(User);
      }
    });
  });

  describe('extend suppresses lazy behavior', function() {
    var count = 0;
    factories.define('extendWithFunction', {
      lazy: function() { count++; return count; }
    });
    count.should.equal(0);
    var objExtended = factories.extendWithFunction
      .extend({lazy: function() { return 42; }})
      .build();
    var objExtended2 = factories.extendWithFunction
      .extend({lazy: 84})
      .build();
    objExtended.should.eql({lazy: 42});
    objExtended2.should.eql({lazy: 84});
    count.should.equal(0);
    var obj1 = factories.extendWithFunction.build();
    var obj2 = factories.extendWithFunction.build();
    obj1.should.eql({lazy: 1});
    obj2.should.eql({lazy: 2});
    count.should.equal(2);

  });

  describe('dependent factory behavior', function() {
    var dependentFactory = factories.build({
      first: 2,
      second: 4,
      sum: function() { return this.first + this.second; },
      double: function() { return this.sum * 2; }
    });

    var objDependent = dependentFactory.build();
    objDependent.first.should.eql(2);
    objDependent.second.should.eql(4);
    objDependent.sum.should.eql(6);
    objDependent.double.should.eql(12);
  });

  describe('after hooks', function() {
    describe('afterAttributes', function() {

      var afterAttributesFactoryRan = 0;
      var afterAttributesFactory = factories.build({
        x: function() { return 6 * 7; }
      });
      afterAttributesFactory.afterAttributes(function(obj) {
        afterAttributesFactoryRan += 1;
        obj.x.should.eql(42);
        obj.x = obj.x + 1;
        return obj;
      });
      afterAttributesFactory.afterAttributes(function(obj) {
        afterAttributesFactoryRan += 1;
        obj.x.should.eql(43);
      });

      it('afterAttributes fires with the right data', function(done) {
        var obj = afterAttributesFactory.attributes();
        obj.x.should.eql(43);
        afterAttributesFactoryRan.should.eql(2);
        done();
      });

    });
    describe('afterBuild', function() {
      var afterBuildFactoryRan = 0;
      var afterBuildFactory = factories.build({
        x: function() { return 6 * 7; }
      });
      afterBuildFactory.afterBuild(function(obj) {
        afterBuildFactoryRan += 1;
        obj.y.should.eql(42);
        obj.y = obj.y + 1;
        return obj;
      });
      afterBuildFactory.afterBuild(function(obj) {
        afterBuildFactoryRan += 1;
        obj.y.should.eql(43);
      });
      afterBuildFactory.afterAttributes(function(obj) {
        afterBuildFactoryRan += 1;
        obj.x.should.eql(42);
        obj.y = obj.x;
        return obj;
      });

      it('afterBuild fires with the right data', function(done) {
        var obj = afterBuildFactory.build();
        obj.x.should.eql(42);
        obj.y.should.eql(43);
        afterBuildFactoryRan.should.eql(3);
        done();
      });
    });

    describe('afterCreate', function() {
      var afterCreateFactoryRan = 0;
      var afterCreateFactory = factories.build(User, {
        name: function() { return 'user name'; }
      });
      afterCreateFactory.afterCreate(function(obj, created, cb) {
        afterCreateFactoryRan += 1;
        created.x = 1;
        cb(null, obj, created);
      });
      afterCreateFactory.afterCreate(function(obj, created, cb) {
        afterCreateFactoryRan += 1;
        cb();
      });
      afterCreateFactory.afterCreate(function(obj, created, cb) {
        created.x.should.eql(1);
        afterCreateFactoryRan += 1;
        created.y = 2;
        cb(null, obj, created);
      });

      it('works', function(done) {
        afterCreateFactory.create(function(err, obj, etc) {
          afterCreateFactoryRan.should.eql(3);
          etc.built.should.eql(1);
          etc.y.should.eql(2);
          done();
        });
      });
    });

    describe('Factory Level', function() {
      factories.define('addItAll', User, {x: 1})
      .afterAttributes(function(obj) {
        obj.y = 2;
        return obj;
      })
      .afterBuild(function(obj) {
        obj.z = 3;
        return obj;
      })
      .afterCreate(function(obj, created, cb) {
        obj.cb = 3;
        cb(obj);
      });

      factories.addItAll.create(function(err, obj, etc) {
        etc.x.should.eql(1);
        etc.y.should.eql(2);
        etc.z.should.eql(3);
        etc.cb.should.eql(3);
      });
    });
  });
});
