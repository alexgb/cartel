var assert = require('chai').assert,
    sinon = require('sinon'),
    rewire = require('rewire'),
    Dispatcher = require('../../lib/dispatcher'),
    Roster = require('../../lib/strategies/match_roster'),
    Request = require('../../lib/payload'),
    Response = require('../../lib/response'),
    EventEmitter = require('events').EventEmitter,
    Prophet = rewire('../../lib/strategies/prophet');

describe('Prophet', function() {
  var controller, dispatcher, roster, socket;

  beforeEach(function() {

    // Mock Dispatcher
    Prophet.__set__("Dispatcher", function() {
      function Surrogate(args) {
        return Dispatcher.apply(this, args);
      }
      Surrogate.prototype = Dispatcher.prototype;
      return (dispatcher = new Surrogate(arguments));
    });

    // Mock Roster
    Prophet.__set__("Roster", function() {
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

    Prophet(controller);
    sinon.spy(controller, 'on');
    controller.emit('@initialize');
  });

  afterEach(function() {
    controller.emit('@teardown');
  });

  describe('.subscribe', function() {
    it('should subscribe a property name and match value', function() {
      sinon.spy(roster, 'add');
      controller.subscribe('name', 'joe', socket);

      assert(roster.add.calledOnce);
      assert(roster.add.calledWith('name', 'joe', socket));
    });
  });

  describe('.unsubscribe', function() {
    it('should subscribe a property name and match value', function() {
      sinon.spy(roster, 'remove');
      controller.unsubscribe('name', 'joe', socket);

      assert(roster.remove.calledOnce);
      assert(roster.remove.calledWith('name', 'joe', socket));
    });
  });

  describe('.publish', function() {
    it('should dispatch published events', function() {
      sinon.spy(dispatcher, 'publish');
      controller.publish('create', ['object']);

      assert(dispatcher.publish.calledOnce);
      assert(dispatcher.publish.calledWith('create', ['object']));
    });
  });

  describe('.unsubscribeSocket', function() {
    it('should remove socket from roster', function() {
      sinon.spy(roster, 'removeFromAll');
      controller.unsubscribeSocket('socket');

      assert(roster.removeFromAll.calledOnce);
      assert(roster.removeFromAll.calledWith('socket'));
    });
  });

  describe('event handling', function() {
    describe('@disconnect', function() {
      it('should remove socket from roster', function () {
        sinon.spy(roster, 'removeFromAll');
        controller.emit('@disconnect', 'socket');

        assert(roster.removeFromAll.calledOnce);
        assert(roster.removeFromAll.calledWith('socket'));
      });
    });

    describe('subscribe', function() {
      it('should add socket to roster based on parameters in request', function() {
        var request = {
          headers: { action: 'subscribe' },
          objects: [],
          meta: { property: 'name', match: 'joe' }
        };

        sinon.spy(roster, 'add');
        controller.emit('@request:subscribe', 'socket', request);

        assert(roster.add.calledOnce);
        assert(roster.add.calledWith('name', 'joe', 'socket'));
      });
    });

    describe('unsubscribe', function() {
      it('should remove socket from roster based on parameters in request', function() {
        var request = {
          headers: { action: 'unsubscribe' },
          objects: [],
          meta: { property: 'name', match: 'joe' }
        };

        sinon.spy(roster, 'remove');
        controller.emit('@request:unsubscribe', 'socket', request);

        assert(roster.remove.calledOnce);
        assert(roster.remove.calledWith('name', 'joe', 'socket'));
      });
    });
  });

});