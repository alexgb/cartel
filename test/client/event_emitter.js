var assert = require('chai').assert,
    sinon = require('sinon'),
    EventEmitter = require('../../client/cartel-client/event_emitter');


describe('EventEmitter', function() {
  var emitter, callback1, callback2;

  beforeEach(function() {
    emitter = new EventEmitter();
    callback1 = sinon.spy();
    callback2 = sinon.spy();
  });

  describe('.addListener', function() {
    beforeEach(function() {
      emitter.addListener('foo', callback1);
      emitter.addListener('foo', callback2);
      emitter.emit('foo');
    });

    it('should call all callbacks once', function() {
      assert(callback1.calledOnce);
      assert(callback2.calledOnce);
    });

    it('should alias .on', function() {
      assert.equal(emitter.addListener, emitter.on);
    });
  });

  describe('.removeListener', function() {
    it('should remove listener', function() {
      emitter.addListener('foo', callback1);
      emitter.removeListener('foo', callback1);
      emitter.emit('foo');

      assert(callback1.notCalled);
    });

    it('should remove listener add using .once', function() {
      emitter.once('foo', callback1);
      emitter.removeListener('foo', callback1);
      emitter.emit('foo');

      assert(callback1.notCalled);
    });
  });

  describe('.removeAllListeners', function() {
    beforeEach(function() {
      emitter.addListener('foo', callback1);
      emitter.addListener('bar', callback2);
    });

    it('should remove listeners for specified event', function() {
      emitter.removeAllListeners('foo');

      assert.lengthOf(emitter.listeners('foo'), 0);
      assert.lengthOf(emitter.listeners('bar'), 1);
    });

    it('should remove all listeners when not event specified', function() {
      emitter.removeAllListeners();

      assert.lengthOf(emitter.listeners('foo'), 0);
      assert.lengthOf(emitter.listeners('bar'), 0);
    });
  });

  describe('.listeners', function() {
    it('should return a list of all listeners', function() {
      emitter.addListener('foo', callback1);
      emitter.addListener('foo', callback2);

      assert.lengthOf(emitter.listeners('foo'), 2);
      assert.include(emitter.listeners('foo'), callback1);
      assert.include(emitter.listeners('foo'), callback2);
    });

    it('should return an empty list when no listeners added', function() {
      assert.isArray(emitter.listeners('foo'));
      assert.lengthOf(emitter.listeners('foo'), 0);
    });
  });

  describe('.once', function() {
    it('should only call callback once', function() {
      emitter.once('foo', callback1);
      emitter.emit('foo');
      emitter.emit('foo');
      assert(callback1.calledOnce);
    });
  });

  describe('.emit', function() {
    beforeEach(function() {
      emitter.addListener('foo', callback1);
      emitter.addListener('foo', callback2);
      emitter.emit('foo', 1, 2);
    });

    it('should call all callbacks for event', function() {
      assert(callback1.calledOnce);
      assert(callback2.calledOnce);
    });

    it('should call callback with passed arguments', function() {
      assert(callback1.calledWith(1,2));
    });
  });

});