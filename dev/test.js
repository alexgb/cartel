var EventEmitter = require('events').EventEmitter,
    assert = require('assert'),
    util = require('util'),
    _ = require('underscore'),
    extend = require('../lib/util').extend;


function Controller() {
  EventEmitter.call(this);
}
util.inherits(Controller, EventEmitter);

Controller.extend = extend;


MyController = Controller.extend({
  foo: 'bar'
});

controllerInstance = new MyController();

assert.equal(controllerInstance.foo, 'bar');
assert.equal(MyController.prototype.foo, 'bar');
assert.equal(controllerInstance.on, EventEmitter.prototype.on);


// // Can we access prototype functions defined to base class after
// // class has been defined?

// assert.throws(function() {
//   controllerInstance.getGlobal();
// });

// Controller.prototype.getGlobal = function() {return "bar";};

// assert.equal(controllerInstance.getGlobal(), 'bar');



// // Does extend handle the process of applying options to instance?

// instanceWithOptions = new Controller({resource: 'fig'});

// assert.notEqual(instanceWithOptions.resource, 'fig');


// // Are configuration options available to parent class in grand child

// function Parent() {
//   for (var i = this.constructor.uses.length - 1; i >= 0; i--) {
//     this.constructor.uses[i](this);
//   }
// }

// Parent.uses = [];
// Parent.use = function(pluginFn) {
//   this.uses.push(pluginFn);
// };

// Parent.use(function(i) {
//   i.visited = i.visited || '';
//   i.visited += ' parent';
// });

// Parent.extend = extend;

// Child = Parent.extend({});

// GrandChild = Child.extend({
//   foo: 'bar'
// });

// GrandChild.use(function(i) {
//   i.visited = i.visited || '';
//   i.visited += ' grand child';
// });


// // GrandChild.use = [function(i){ console.log('gradchild plugin'); }];

// var i = new GrandChild({});

// console.log(i.visited);



// ////

// var Foo = {};
// Foo.listen = function() { this.emit('listen'); };
// // util.inherits(Foo.prototype, EventEmitter);
// // Foo.prototype.__proto__ = EventEmitter.prototype;
// EventEmitter.call(Foo);
// _.extend(Foo, EventEmitter.prototype);

// assert.equal(Foo.on, EventEmitter.prototype.on);

// Foo.on('listen', function() {console.log('* listen');});
// Foo.listen();
