var assert = require('chai').assert,
    sinon = require('sinon'),
    Dispatcher = require('../lib/dispatcher'),
    Server = require('../'),
    ChannelController = Server.Channel;

// Noop setupWhen otherwise tests attach lots of listeners
// on Server object and EventEmitter warns about memory leak.
Server.onReady = function() {};


describe('ChannelController', function() {
  var resourceNameIncr = 0,
      resourceName,
      Klass, controller;

  beforeEach(function() {
    resourceNameIncr++;
    resourceName = 'widgets' + resourceNameIncr;

    controller = new ChannelController({
      resource: resourceName
    });
  });


  describe('receiving messages', function() {
    var sendFakeMessage = function(socket, data, callback) {
          controller.handleMessage(socket, data, callback);
        },
        message;

    beforeEach(function() {
      message = {
        headers: {action: 'update'},
        objects: [{id: 1, title: 'foo'}]
      };
    });

    it('should pass request, response, and ack callback to handlers', function(done) {
      controller.on('update', function(request, response, ack) {
        assert.equal(request.getAction(), 'update');
        assert.isFunction(response.setHeader);
        assert.isFunction(ack);
        done();
      });
      sendFakeMessage({}, message, function() {});
    });

    it('should return response with error when ack is called with error', function(done) {
      controller.on('update', function(request, response, ack) {
        ack('Spilt milk');
      });

      sendFakeMessage({}, message, function(response) {
        assert.equal(response.headers.status, 500);
        assert.equal(response.headers.message, 'Spilt milk');
        done();
      });
    });
  });

  describe('.send', function() {
    it('should dispatch message sending', function() {
      var request = {headers: {action: 'read'}};

      sinon.spy(controller.dispatcher, 'publish');
      sinon.stub(controller.socketInterface, 'send');

      controller.send(request);

      assert(controller.dispatcher.publish.calledOnce);
      assert(controller.socketInterface.send.calledOnce);
      assert(controller.socketInterface.send.calledWith(resourceName, request));
    });
  });

  describe('.teardown', function() {
    it('should unsubscribe from dispatcher', function() {
      sinon.spy(controller.dispatcher, 'unsubscribe');
      controller.teardown();

      assert(controller.dispatcher.unsubscribe.calledOnce);
    });
  });

});