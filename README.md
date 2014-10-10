#node-factories [![Build Status](https://secure.travis-ci.org/jkanschik/node-factories.png)](http://travis-ci.org/jkanschik/node-factories) [![Code Climate](https://codeclimate.com/github/jkanschik/node-factories.png)](https://codeclimate.com/github/jkanschik/node-factories) [![devDependency Status](https://david-dm.org/jkanschik/node-factories/dev-status.png)](https://david-dm.org/jkanschik/node-factories#info=devDependencies)

Node-factories is used to create test data in a simple way. It is inspired by [factory_girl](https://github.com/thoughtbot/factory_girl) which is used in the ruby-world.

Similar to factory_girl, it supports multiple build strategies (build(), attributes() and create()), sequences and traits to cover the typical requirements for generating test data.

## Installation

Node.js:

```
npm install node-factories
```

## Simple factories

Simple definition of a user:

```javascript
var factories = require('factories');
factories.define('user', {
  firstName: 'John',
  lastName: 'Doe',
  isAdmin: false
});
// build a user:
factories.user.build();
// build an array of 10 users
factories.user.build(10);
```

## Building strategies

There are different strategies to create a new object: 'attributes()' creates an Object with the attributes defined in the factory definition; 'build()' creates an Object with the prototype of the factory definition and 'create()' calls the 'create()' method on each object.

```javascript
factories.define('user', {
  //...
});
typeof factories.user.attributes();
// => 'object'
typeof factories.user.build();
// => 'object'
var User = function() {};
factories.define('userWithPrototype', User, {
  //...
});
typeof factories.user.attributes();
// => 'object'
typeof factories.user.build();
// => 'function'
```

## Lazy attributes

Instead of assigning static values to the attributes, lazy attributes can be defined. In this case, the attribute value in the definition of the object is a function, which is evaluated whenever an object is created.

```javascript
factories.define('user', {
  // ...
  createdAt: function() { return new Date(); }
});
```

## Sequences

Sequences are used to generate unique values (as opposed to the users above, which all have the same name). Basically, node-factories maintains a counter for each sequence which is increased anytime an object is created. This counter is passed to a function, which determines the actual attribute value.

```javascript
var factories = require('factories');
factories.define('userWithMail', {
  firstName: 'John',
  lastName: 'Doe'
})
.sequence('email', function(i) {return 'person_' + i + '@example.com'});
// sequence starts with i=0:
factories.userWithMail.build().email
// => person_0@example.com
factories.userWithMail.build().email
// => person_1@example.com
```

Sequences can also be defined globally, i.e. they can be used in different factories.
```javascript
factories.sequence('email', function(i) {return 'person_' + i + '@example.com'});
factories.define(userWithMail, {
  // ...
})
.sequence('email');
factories.define(otherObject, {
  // ...
})
.sequence('email');
// the sequence is now increased globally:
factories.userWithMail.build().email
// => person_0@example.com
factories.otherObject.build().email
// => person_1@example.com
```

Sometimes, a factory has a sequence that needs to be reset.  This is especially true in multiple-test situations where some sequences have cyclical data (like day of week).  This is easily achieved by running factory.reset()

```javascript
var factories = require('factories');
factories.define('userWithMail', {
  firstName: 'John',
  lastName: 'Doe'
})
.sequence('email', function(i) {return 'person_' + i + '@example.com'});
// sequence starts with i=0:
factories.userWithMail.build().email
// => person_0@example.com
factories.userWithMail.reset();
factories.userWithMail.build().email
// => person_0@example.com

```

## Traits

You can use traits for advanced configuration:

```javascript
var factories = require('factories');
factories.define('user', {
  firstName: 'John',
  lastName: 'Doe',
  isAdmin: false
})
.trait('admin', { isAdmin: true } );
// build a normal user:
factories.user.build();
// and an admin:
factories.user.trait('admin').build();
```
