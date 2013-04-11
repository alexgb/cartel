var assert = require('chai').assert,
    sinon = require('sinon'),
    Payload = require('../lib/payload'),
    Feed = require('../lib/feed').with({
      EventEmitter: require('events').EventEmitter
    });


describe('Feed', function() {
  var resourceNameIncr = 0,
      resourceName;

  beforeEach(function() {
    resourceNameIncr++;
    resourceName = 'widgets' + resourceNameIncr;
  });


  describe('actions', function() {
    it('should setup named event listeners for defined actions on class', function() {
      var Child = Feed.extend({
            resource: resourceName,
            actions: {
              read: 'onRead'
            },
            onRead: sinon.spy()
          }),
          instance = new Child(),
          arg = {};

      instance.emit('read', arg);

      assert(instance.onRead.calledOnce);
      assert(instance.onRead.calledWith(arg));
      assert(instance.onRead.calledOn(instance));
    });

    it('should setup named event listeners defined in constructor options', function() {
      var Child = Feed.extend({
            resource: resourceName,
            onRead: sinon.spy()
          }),
          instance = new Child({
            actions: {
              read: 'onRead'
            }
          }),
          arg = {};

      instance.emit('read', arg);

      assert(instance.onRead.calledOnce);
      assert(instance.onRead.calledWith(arg));
      assert(instance.onRead.calledOn(instance));
    });

    it('should setup event listeners with plain function values', function() {
      var callback = sinon.spy(),
          Child = Feed.extend({
            resource: resourceName,
            actions: {
              read: callback
            }
          }),
          instance = new Child(),
          arg = {};

      instance.emit('read', arg);

      assert(callback.calledOnce);
      assert(callback.calledWith(arg));
      assert(callback.calledOn(instance));
    });
  });


  describe('idProperty', function() {
    it('should have a default idProperty of id', function() {
      var instance = new Feed({resource: resourceName});

      assert.equal(instance.idProperty, 'id');
    });

    it('should be configurable in class definition', function() {
      var Child = Feed.extend({
            resource: resourceName,
            idProperty: 'uid'
          }),
          instance = new Child();

      assert.equal(instance.idProperty, 'uid');
    });

    it('should be configurable in constructor options', function() {
      var instance = new Feed({
        resource: resourceName,
        idProperty: 'uid'
      });

      assert.equal(instance.idProperty, 'uid');
    });
  });

  describe('sending messages', function() {
    var feed, socket, message;

    beforeEach(function() {
      feed = Feed.define({
        resource: resourceName
      });
      socket = {};
      socket.on = sinon.stub();
      socket.emit = sinon.stub();
      feed.socketInterface.realize(socket);
      message = {
        headers: {action: 'read'},
        objects: []
      };
    });

    describe('.send', function() {
      var callback;
      beforeEach(function() {
        callback = sinon.spy();
      });

      it('should emit sent request', function() {
        feed.send(message, callback);

        assert(socket.emit.calledOnce, 'call emit');
        assert(socket.emit.calledWith(resourceName, message), 'with arguments');
      });

      it('should emit sent action and objects', function() {
        var objects = [{id: 100}, {id: 101}];
        feed.send('create', objects, callback);

        assert(socket.emit.calledOnce, 'call emit');
        assert.equal(socket.emit.args[0][0], resourceName);
        assert.equal(socket.emit.args[0][1].headers.action, 'create');
        assert.equal(socket.emit.args[0][1].objects, objects);
      });

      it('should emit sent action without objects', function() {
        feed.send('create', callback);

        assert(socket.emit.calledOnce, 'call emit');
        assert.equal(socket.emit.args[0][0], resourceName);
        assert.equal(socket.emit.args[0][1].headers.action, 'create');
      });

      it('should fire send event with request', function() {
        feed.emit = sinon.spy();
        feed.send(message, callback);

        assert(feed.emit.calledOnce, 'call emit');
        assert(feed.emit.calledWith('@send:read', message), 'with arguments');
      });

      it('should call callback with payload instance', function() {
        socket.emit.callsArgWith(2, {
          headers: { status: 200 },
          objects: [],
          meta: {}
        });
        feed.send('create', [], callback);

        assert(callback.calledOnce);
        assert.instanceOf(callback.args[0][0], Payload);
      });

      it('should emit @reply when ack callback is called', function() {
        socket.emit.callsArgWith(2, {
          headers: { status: 200 },
          objects: [],
          meta: {}
        });
        feed.on('@reply:create', callback);
        feed.send('create', []);

        assert(callback.calledOnce);
      });
    });


    it('should emit create request', function() {
      feed.create('objects', 'callback');

      var sentMessage = socket.emit.getCall(0).args[1];

      assert(socket.emit.calledOnce, 'call emit');
      assert(sentMessage.headers.action == 'create', 'action is create');
      assert(sentMessage.objects == 'objects', 'contains objects');
    });

    it('should emit read request', function() {
      feed.read('params', 'callback');

      var sentMessage = socket.emit.getCall(0).args[1];

      assert(socket.emit.calledOnce, 'call emit');
      assert(sentMessage.headers.action == 'read', 'action is read');
      assert(sentMessage.meta.params == 'params', 'contains parameters');
    });

    it('should emit update request', function() {
      feed.update('objects', 'callback');

      var sentMessage = socket.emit.getCall(0).args[1];

      assert(socket.emit.calledOnce, 'call emit');
      assert(sentMessage.headers.action == 'update', 'action is update');
      assert(sentMessage.objects == 'objects', 'contains objects');
    });

    it('should emit delete request', function() {
      feed.delete('objects', 'callback');

      var sentMessage = socket.emit.getCall(0).args[1];

      assert(socket.emit.calledOnce, 'call emit');
      assert(sentMessage.headers.action == 'delete', 'action is delete');
      assert(sentMessage.objects == 'objects', 'contains objects');
    });
  });

  describe('global resource instances', function() {
    var Child;

    beforeEach(function() {
      Child = Feed.extend({
        resource: resourceName
      });
    });

    it('should return an already instantiated instance using .getInstance', function() {
      var instance = new Child();

      assert.equal(Child.getInstance(resourceName), instance);
      assert.equal(Feed.getInstance(resourceName), instance);
    });

    it('should throw an error when initializing without resource name', function() {
      assert.throws(function() {
        new Feed();
      }, /resource/);
    });

    it('should work with resource names defined in constructor options', function() {
      var instance = new Feed({resource: resourceName});

      assert.equal(instance, Feed.getInstance(resourceName));
    });
  });


  describe('.teardown', function() {
    var feed;
    beforeEach(function (){
      feed = Feed.define({
        resource: resourceName
      });
    });

    it('should emit @teardown event', function() {
      var callback = sinon.spy();
      feed.on('@teardown', callback);
      feed.teardown();

      assert(callback.calledOnce);
    });

    it('should remove all internal event listeners', function() {
      sinon.spy(feed, 'removeAllListeners');
      feed.teardown();

      assert(feed.removeAllListeners.calledOnce);
    });
  });

});