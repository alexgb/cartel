var assert = require('chai').assert,
    sinon = require('sinon'),
    SocketInterface = require('../lib/socket_interface');

describe('SocketInterface', function() {
  var socket, socketInterface;

  beforeEach(function() {
    socket = {};
    socket.on = sinon.spy();
    socket.emit = sinon.spy();

    socketInterface = new SocketInterface();
  });

  describe('.on', function() {
    it('should pass to socket', function() {
      socketInterface.realize(socket);
      socketInterface.on('foo', 'bar');

      assert(socket.on.calledOnce);
      assert(socket.on.calledWith('foo', 'bar'));
    });

    it('should queue calls to .on until socket is realized', function() {
      socketInterface.on('foo', 'bar');

      assert(socket.on.notCalled, 'not called');

      socketInterface.realize(socket);

      assert(socket.on.calledOnce, 'called once');
      assert(socket.on.calledWith('foo', 'bar'), 'called with args');
    });
  });

  describe('.send', function() {
    it('should pass to socket .emit', function() {
      socketInterface.realize(socket);
      socketInterface.send('foo', 'bar');

      assert(socket.emit.calledOnce);
      assert(socket.emit.calledWith('foo', 'bar'));
    });

    it('should queue calls to .send until socket is realized', function() {
      socketInterface.send('foo', 'bar');

      assert(socket.emit.notCalled, 'not called');

      socketInterface.realize(socket);

      assert(socket.emit.calledOnce, 'called once');
      assert(socket.emit.calledWith('foo', 'bar'), 'called with args');
    });
  });
});