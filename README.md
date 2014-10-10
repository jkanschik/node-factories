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

## Anonymous factories

Sometimes, we don't want to save our factory in the global namespace.  'factories.build()' will allow the anonymous creation of a factory that can be saved to a variable.  While it cannot be retrieved if the variable is lost, it is no longer in the way in a project that has a large number of complicated tests.

```javascript
var factories = require('factories');
var user_factory = factories.build({
  firstName: 'John',
  lastName: 'Doe',
  isAdmin: false
});
// build a user:
user_factory.build();
// build an array of 10 users
user_factory.build(10);
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

## Extending Attributes

Sometimes, there is a need to create multiple similar objects from the same factory where those objects are otherwise too distinct or interrelated for sequences. In such a situation, it is useful (and a common pattern) to override some or all of the fields, while still maintaining the power of the factories (including support for sequences and traits).


```javascript
var factories = require('factories');
factories.define('user', {
  firstName: 'John',
  lastName: 'Doe',
  isAdmin: false
});
// build a user:
factories.user.build();
// build a user named "Joe Doe"
factories.user.extend({firstName: "Joe"});
// build another user named "John Doe"
factories.user.build();
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
