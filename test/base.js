var assert = require('chai').assert,
    sinon = require('sinon'),
    Base = require('../lib/base').with({
      EventEmitter: require('events').EventEmitter
    });


describe('Base', function() {

  describe('events', function() {
    it('should quack like event emitter', function() {
      var instance = new Base();

      assert.isFunction(instance.on);
      assert.isFunction(instance.emit);
    });

    it('should have an initialize event', function() {
      var eventHandler = sinon.spy(),
          plugin = function(instance) {
            instance.on('@initialize', eventHandler);
          },
          options = {};

      Base.use(plugin);
      new Base();

      assert(eventHandler.calledOnce);
      assert(eventHandler.calledWith(options));
    });

    it('should be able to define events from class .on', function() {
      var handler = sinon.spy(),
          instance;

      Base.on('@initialize', handler);
      instance = new Base();

      assert(handler.calledOnce);
      assert(handler.calledOn(instance));
    });

    it('should be able to attache events to event namespaces', function() {
      var handler = sinon.spy(),
          instance = new Base();

      instance.on('foo:*', handler);
      instance.emit('foo:bar', 'arg1', 'arg2');

      assert(handler.calledOnce);
      assert(handler.calledWith('foo:bar', 'arg1', 'arg2'));
    });
  });


  describe('inheritance behavior', function() {
    var Child, GrandChild;

    beforeEach(function() {
      Child = Base.extend({
        walk: function() {}
      });
      GrandChild = Child.extend({
        run: function() {}
      });
    });

    describe('.extend', function() {
      it('should inherit methods from parent classes', function() {
        var grandChild = new GrandChild();

        assert.isFunction(grandChild.run);
        assert.isFunction(grandChild.walk);
      });

      it('should inherit static methods', function() {
        Child.all = function() {};
        GrandChild = Child.extend();

        assert.equal(Child.all, GrandChild.all);
      });

      it('should add static methods to subclass', function() {
        var all = function() {};
        GrandChild = Child.extend({}, {all: all});

        assert.equal(all, GrandChild.all);
      });
    });

    describe('.define', function() {
      it('should subclass and instantiate using .define', function() {
        var grandChild = Child.define({
              run: function() {}
            });

        assert.isFunction(grandChild.run);
        assert.equal(grandChild.constructor.__superConstructor__, Child);
      });
    });
  });


  describe('initialization', function() {
    it('should pass constructor options argument to initialization method', function() {
      var options = {};

      Base.prototype.initialize = sinon.spy();
      new Base(options);

      assert(Base.prototype.initialize.calledOnce);
      assert(Base.prototype.initialize.calledWith(options));
    });
  });


  describe('plugin behavior', function() {
    var Child, GrandChild, plugin1, plugin2, plugin3, plugin4;

    beforeEach(function() {
      plugin1 = sinon.spy();
      plugin2 = sinon.spy();
      plugin3 = sinon.spy();
      plugin4 = sinon.spy();

      Child = Base.extend({
        use: plugin1
      });
      Child.use(plugin2);

      GrandChild = Child.extend();
      GrandChild.use(plugin3);
      GrandChild.use(plugin4);
    });

    it('should call plugin from use prototype property', function() {
      var instance = new Child();
      assert(plugin1.calledOnce);
    });

    it('should call plugin with instance', function() {
      var instance = new Child();
      assert(plugin1.calledWith(instance));
    });

    it('should call plugins defined by .use', function() {
      var instance = new Child();

      assert(plugin2.calledOnce);
    });

    it('should call superclass plugins', function() {
      var instance = new GrandChild();

      assert(plugin1.calledOnce);
      assert(plugin2.calledOnce);
      assert(plugin3.calledOnce);
      assert(plugin4.calledOnce);
    });

    it('should not call child class plugins', function() {
      new Child();

      assert(plugin3.notCalled);
      assert(plugin4.notCalled);
    });
  });

});
