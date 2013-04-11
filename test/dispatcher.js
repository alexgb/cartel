var assert = require('chai').assert,
    sinon = require('sinon'),
    Dispatcher = require('../lib/dispatcher');

describe('Dispatcher', function() {
  var dispatcherA1, dispatcherA2, dispatcherB1;

  beforeEach(function() {
    dispatcherA1 = new Dispatcher('a');
    dispatcherA2 = new Dispatcher('a');
    dispatcherB1 = new Dispatcher('b');
  });

  it('should receive events published within dispatcher instance', function() {
    var callback = sinon.spy();

    dispatcherA1.subscribe(callback);
    dispatcherA1.publish('foo', 'bar');

    assert(callback.calledOnce);
    assert(callback.calledWith('foo', 'bar'));
  });

  it('should receive events published across dispatchers registered to same name', function() {
    var callback = sinon.spy();

    dispatcherA1.subscribe(callback);
    dispatcherB1.publish('foo', 'bar');

    assert(callback.notCalled);
  });

  it('should publish events across dispatchers registered to same name', function() {
    var callback = sinon.spy();

    dispatcherA1.subscribe(callback);
    dispatcherA2.publish('foo', 'bar');

    assert(callback.called);
    assert(callback.calledWith('foo', 'bar'));
  });

  it('should not call callbacks after unsubscribing from dispatcher', function() {
    var callback = sinon.spy();

    dispatcherA1.subscribe(callback);
    dispatcherA1.unsubscribe(callback);
    dispatcherA2.publish('foo', 'bar');

    assert(callback.notCalled);
  });
});