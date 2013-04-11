var assert = require('chai').assert,
    sinon = require('sinon'),
    rewire = require('rewire'),
    Dispatcher = require('../../lib/dispatcher'),
    Roster = require('../../lib/strategies/roster'),
    Request = require('../../lib/payload'),
    Response = require('../../lib/response'),
    EventEmitter = require('events').EventEmitter,
    Informer = rewire('../../lib/strategies/informer');


describe('Informer', function() {
  var controller, dispatcher, roster, socket;

  beforeEach(function() {

    // Mock Dispatcher
    Informer.__set__("Dispatcher", function() {
      function Surrogate(args) {
        return Dispatcher.apply(this, args);
      }
      Surrogate.prototype = Dispatcher.prototype;
      return (dispatcher = new Surrogate(arguments));
    });

    // Mock Roster
    Informer.__set__("Roster", function() {
      function Surrogate(args) {
        return Roster.apply(this, args);
      }
      Surrogate.prototype = Roster.prototype;
      return (roster = new Surrogate(arguments));
    });

    // Mock Controller
    controller = new EventEmitter();
    controller.idProperty = 'id';
    controller.resource = 'widgets';

    // Mock Socket
    socket = {};
    socket.emit = sinon.spy();

    Informer(controller);
    sinon.spy(controller, 'on');
    controller.emit('@initialize');
  });

  afterEach(function() {
    controller.emit('@teardown');
  });

  describe('CRUD event watching', function() {
    beforeEach(function() {
      sinon.spy(roster, 'add');
      sinon.spy(roster, 'remove');
      sinon.spy(roster, 'removeFromAll');
      sinon.spy(roster, 'destroyKey');
    });

    describe('read requests', function() {
      var request, response;
      beforeEach(function() {
        request = new Request({headers: {action: 'read'}});
        response = new Response({objects: [{id: 100}, {id: 101}]});
      });

      it('should unsubscribe any existing subscriptions and subscribe objects from response', function() {
        controller.emit('@respond:read', socket, request, response);

        assert(roster.removeFromAll.calledOnce);
        assert(roster.removeFromAll.calledWith(socket));
        assert(roster.add.calledTwice);
        assert(roster.add.calledWith(100, socket));
        assert(roster.add.calledWith(101, socket));
      });

      it('should not unsubscribe existing subscriptions when append:true', function() {
        request.headers.append = true;
        controller.emit('@respond:read', socket, request, response);

        assert(roster.removeFromAll.notCalled);
        assert(roster.add.calledTwice);
        assert(roster.add.calledWith(100, socket));
        assert(roster.add.calledWith(101, socket));
      });

      it('should not subscribe objects when response has error', function() {
        response.setError(500);
        controller.emit('@respond:read', socket, request, response);

        assert(roster.add.notCalled);
      });
    });

    describe('create requests', function() {
      var response, request;
      beforeEach(function() {
        request = new Request({headers: {action: 'create'}});
        response = new Response({objects: [{id: 100}, {id: 101}]});
      });

      it('should subscribe objects from response', function() {
        controller.emit('@respond:create', socket, request, response);

        assert(roster.add.calledTwice);
        assert(roster.add.calledWith(100, socket));
        assert(roster.add.calledWith(101, socket));
      });

      it('should not subscribe objects when response has error', function() {
        response.setError(500);
        controller.emit('@respond:create', socket, null, response);

        assert(roster.add.notCalled);
      });
    });

    describe('delete requests', function() {
      var request, response;
      beforeEach(function() {
        request = new Request({
          headers: { action: 'delete' },
          objects: [{id: 100}, {id: 101}]
        });
        response = new Response();
      });

      it('should unsubscribe objects from response', function() {
        controller.emit('@respond:delete', socket, request, response);

        assert(roster.remove.calledTwice);
        assert(roster.remove.calledWith(100, socket));
        assert(roster.remove.calledWith(101, socket));
      });

      it('should not unsubscribe objects when response has error', function() {
        response.setError(500);
        controller.emit('@respond:create', socket, request, response);

        assert(roster.remove.notCalled);
      });
    });

    describe('.send', function() {
      var request;
      beforeEach(function() {
        request = new Request({
          headers: {action: 'create'},
          objects: [{id: 100}, {id: 101}]
        });
      });

      it('should subscribe objects in create requests for all connected sockets', function() {
        var socket1 = {}, socket2 = {};
        controller.socketInterface = {
          sockets: {1: socket1, 2: socket2}
        };
        request.headers.action = 'create';
        controller.emit('@send:create', request);

        assert.equal(roster.add.callCount, 4, 'called once for each socket and object combination');
        assert(roster.add.calledWith(100, socket1));
        assert(roster.add.calledWith(101, socket1));
        assert(roster.add.calledWith(100, socket2));
        assert(roster.add.calledWith(101, socket2));
      });

      it('should unsubscribe objects in delete requests', function() {
        request.headers.action = 'delete';
        controller.emit('@send:delete', request);

        assert(roster.destroyKey.calledTwice);
        assert(roster.destroyKey.calledWith(100));
        assert(roster.destroyKey.calledWith(101));
      });
    });

    describe('subscribe events', function() {
      var request;
      beforeEach(function() {
        request = new Request({
          headers: { action: 'subscribe' },
          objects: [{id: 100}, {id: 101}]
        });
      });

      it('should subscribe objects in request', function() {
        controller.emit('subscribe', socket, request);

        assert(roster.add.calledTwice);
        assert(roster.add.calledWith(100, socket));
        assert(roster.add.calledWith(101, socket));
      });
    });

    describe('unsubscribe events', function() {
      var request;
      beforeEach(function() {
        request = new Request({
          headers: { action: 'unsubscribe' },
          objects: [{id: 100}, {id: 101}]
        });
      });

      it('should unsubscribe objects in request', function() {
        controller.emit('unsubscribe', socket, request);

        assert(roster.remove.calledTwice);
        assert(roster.remove.calledWith(100, socket));
        assert(roster.remove.calledWith(101, socket));
      });
    });

    describe('unsubscribeall events', function() {
      var request;
      beforeEach(function() {
        request = new Request({
          headers: { action: 'unsubscribeall' },
          objects: []
        });
      });

      it('should unsubscribe socket from all objects in roster', function() {
        controller.emit('unsubscribeall', socket, request);

        assert(roster.removeFromAll.calledOnce);
        assert(roster.removeFromAll.calledWith(socket));
      });
    });

    describe('disconnect events', function() {
      it('should unsubscribe socket from all objects in roster', function() {
        controller.emit('@disconnect', socket);

        assert(roster.removeFromAll.calledOnce);
        assert(roster.removeFromAll.calledWith(socket));
      });
    });
  });

  describe('event publishing', function() {
    var matchingObjectIds, socket1, socket2;
    beforeEach(function() {
      matchingObjectIds = function() {
        var ids = Array.prototype.slice.call(arguments, 0);

        return sinon.match(function(message) {
          var objectIds = message.objects.map(function(o) {
            return o.id;
          });

          return sinon.match(ids).test(objectIds);
        }, "has same objects");
      };

      socket1 = {id: 1};
      socket2 = {id: 2};

      socket1.emit = sinon.spy();
      socket2.emit = sinon.spy();

      sinon.stub(roster, 'get');
    });

    it('should emit updates to concerned sockets', function() {
      roster.get.withArgs(100).returns([socket1]);
      roster.get.withArgs(101).returns([socket1]);
      dispatcher.publish('update', [{id: 100}, {id: 101}]);

      assert(socket1.emit.calledOnce);
      assert(socket1.emit.calledWith(controller.resource, matchingObjectIds(100, 101)));
    });

    it('should only send updates socket is concerned with', function() {
      roster.get.withArgs(100).returns([socket, socket2]);
      roster.get.withArgs(101).returns([socket]);

      dispatcher.publish('update', [{id: 100}, {id: 101}]);

      assert(socket2.emit.calledOnce);
      assert(socket2.emit.calledWith(controller.resource, matchingObjectIds(100)));
    });
  });

  describe('public methods', function() {
    beforeEach(function() {
      sinon.spy(dispatcher, 'publish');
    });

    describe('.publish', function() {
      it('should publish object events through dispatcher for array of objects', function() {
        var object = {id: 100};
        controller.publish('update', [object]);

        assert(dispatcher.publish.calledOnce);
        assert(dispatcher.publish.calledWith('update', [object]));
      });

      it('should publish object events through dispatcher for single object', function() {
        var object = {id: 100};
        controller.publish('update', object);

        assert(dispatcher.publish.calledOnce);
        assert(dispatcher.publish.calledWith('update', [object]));
      });
    });

    describe('.subscribe', function() {
      beforeEach(function() {
        sinon.spy(roster, 'add');
      });

      it('should add socket to roster for specified object', function() {
        controller.subscribe(socket, {id: 'foo'});

        assert(roster.add.calledOnce);
        assert(roster.add.calledWith('foo', socket));
      });

      it('should add socket to roster for specified array of objects', function() {
        controller.subscribe(socket, [{id: 'foo'}, {id: 'bar'}]);

        assert(roster.add.calledTwice);
        assert(roster.add.calledWith('foo', socket));
        assert(roster.add.calledWith('bar', socket));
      });
    });

    describe('.unsubscribe', function() {
      beforeEach(function() {
        sinon.spy(roster, 'remove');
      });

      it('should remove socket from roster for object', function() {
        controller.unsubscribe(socket, {id: 'foo'});

        assert(roster.remove.calledOnce);
        assert(roster.remove.calledWith('foo', socket));
      });

      it('should remove socket from roster for array of objects', function() {
        controller.unsubscribe(socket, [{id: 'foo'}, {id: 'bar'}]);

        assert(roster.remove.calledTwice);
        assert(roster.remove.calledWith('foo', socket));
        assert(roster.remove.calledWith('bar', socket));
      });
    });

    describe('.unsubscribeObject', function() {
      beforeEach(function() {
        sinon.spy(roster, 'destroyKey');
      });

      it('should be able to unsubscribe an object from roster', function() {
        controller.unsubscribeObject({id: 'foo'});

        assert(roster.destroyKey.calledOnce);
        assert(roster.destroyKey.calledWith('foo'));
      });

      it('should be able to unsubscribe an array of objects', function() {
        controller.unsubscribeObject([{id: 'foo'}, {id: 'bar'}]);

        assert(roster.destroyKey.calledTwice);
        assert(roster.destroyKey.calledWith('foo'));
        assert(roster.destroyKey.calledWith('bar'));
      });
    });

    describe('.unsubscribeSocket', function() {
      beforeEach(function() {
        sinon.spy(roster, 'removeFromAll');
      });

      it('should be able to unsubscribe a socket from roster', function() {
        controller.unsubscribeSocket(socket);

        assert(roster.removeFromAll.calledOnce);
        assert(roster.removeFromAll.calledWith(socket));
      });

      it('should be able to unsubscribe an array of sockets from roster', function() {
        controller.unsubscribeSocket([[socket, socket]]);

        assert(roster.removeFromAll.calledTwice);
        assert.equal(roster.removeFromAll.args[0][0], socket);
        assert.equal(roster.removeFromAll.args[1][0], socket);
      });
    });

  });

});
