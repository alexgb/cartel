var assert = require('chai').assert,
    sinon = require('sinon'),
    rewire = require('rewire'),
    Dispatcher = require('../../lib/dispatcher'),
    Roster = require('../../lib/strategies/roster'),
    Request = require('../../lib/payload'),
    Response = require('../../lib/response'),
    EventEmitter = require('events').EventEmitter,
    Pusher = rewire('../../lib/strategies/pusher');


describe('Pusher', function() {
  var controller, dispatcher, roster, socket;

  beforeEach(function() {

    // Mock Dispatcher
    Pusher.__set__("Dispatcher", function() {
      function Surrogate(args) {
        return Dispatcher.apply(this, args);
      }
      Surrogate.prototype = Dispatcher.prototype;
      return (dispatcher = new Surrogate(arguments));
    });

    // Mock Roster
    Pusher.__set__("Roster", function() {
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

    Pusher(controller);
    sinon.spy(controller, 'on');
    controller.emit('@initialize');
  });

  describe('internal event handling', function() {
    beforeEach(function() {
      sinon.spy(roster, 'add');
      sinon.spy(roster, 'remove');
    });

    it('should add socket to roster on connect', function() {
      controller.emit('@connect', socket);

      assert(roster.add.calledOnce);
      assert.equal(roster.add.args[0][1], socket);
    });

    it('should remove socket from roster on disconnect', function() {
      controller.emit('@disconnect', socket);

      assert(roster.remove.calledOnce);
      assert.equal(roster.remove.args[0][1], socket);
    });

    describe('subscribe, unsubscribe', function() {
      var request;
      beforeEach(function() {
        request = new Request({
          headers: { action: 'subscribe' }
        });
      });

      it('should add socket to roster on subscribe when specifying id of "*"', function() {
        request.objects = [{id: '*'}];
        controller.emit('subscribe', socket, request);

        assert(roster.add.calledOnce);
        assert.equal(roster.add.args[0][1], socket);
      });

      it('should not add socket to roster on subscribe without id of "*"', function() {
        request.objects = [{id: 101}];
        controller.emit('subscribe', socket, request);

        assert(roster.add.notCalled);
      });

      it('should remove socket from roster on unsubscribe when specifying id of "*"', function() {
        request.objects = [{id: '*'}];
        controller.emit('unsubscribe', socket, request);

        assert(roster.remove.calledOnce);
        assert.equal(roster.remove.args[0][1], socket);
      });

      it('should not remove socket from roster on usubscribe without id of "*"', function() {
        request.objects = [{id: 101}];
        controller.emit('unsubscribe', socket, request);

        assert(roster.remove.notCalled);
      });
    });
  });

  describe('event publishing', function() {
    it('should emit updates to concerned sockets', function() {
      sinon.stub(roster, 'get');
      roster.get.withArgs('*').returns([socket]);
      dispatcher.publish('update', [{id: 100}, {id: 101}]);

      var messageObjIds = socket.emit.args[0][1].objects.map(function(o) {
        return o.id;
      });

      assert(socket.emit.calledOnce);
      assert(socket.emit.calledWith(controller.resource));
      assert.include(messageObjIds, 100);
      assert.include(messageObjIds, 101);
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

      it('should add socket to roster', function() {
        controller.subscribe(socket);

        assert(roster.add.calledOnce);
        assert.equal(roster.add.args[0][1], socket);
      });
    });

    describe('.unsubscribe', function() {
      beforeEach(function() {
        sinon.spy(roster, 'remove');
      });

      it('should remove socket from roster for object', function() {
        controller.unsubscribe(socket);

        assert(roster.remove.calledOnce);
        assert.equal(roster.remove.args[0][1], socket);
      });
    });

  });

});
