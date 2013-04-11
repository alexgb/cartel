var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    _ = require('underscore'),
    Server = require('./server'),
    Dispatcher = require('./dispatcher'),
    Request = require('./payload'),
    Response = require('./response'),
    Feed = require('./feed').with({
      EventEmitter: require('events').EventEmitter
    }),
    ChannelController;


module.exports = ChannelController = Feed.extend();


/**
 * ChannelController initialization method
 */

ChannelController.on('@initialize', function() {
  var _this = this;

  // Realize socketInterface when server is setup.
  Server.onReady(function() {
    _this.socketInterface.realize(Server.socketNamespace);
  });

  // Bind connected sockets to controller message ingestion.
  this.socketInterface.on('connection', function(socket) {
    socket.on(_this.resource, function(message, callback) {
      _this.handleMessage(socket, message, callback);
    });
    _this.emit('@connect', socket);

    socket.on('disconnect', function() {
      _this.emit('@disconnect', socket);
    });
  });

  // Central dispatcher for resource notifications
  this.dispatcher = new Dispatcher(this.resource);
  function onDispatch(args) {
    _this.sendToConnected.apply(_this, args);
  }
  this.dispatcher.subscribe(onDispatch);

  // Unsubscribe from dispatcher on teardown
  this.on('@teardown', function() {
    _this.dispatcher.unsubscribe(onDispatch);
  });
});

/**
 * Send a message to sockets connected to only this controller.
 * See Feed#send.
 * 
 * @api private
 */

ChannelController.prototype.sendToConnected = ChannelController.__super__.send;

/**
 * Send message to all connected clients.
 * This overrides Feed#send so that messages are dispatched across
 * processes if needed.

 * @param {Object} request conforming to message semantics
 * @param {Function} remote callback
 * @api public
 */

ChannelController.prototype.send = function() {
  this.dispatcher.publish(Array.prototype.slice.call(arguments, 0));
};

/**
 * Called when a message is received from a client channel
 *
 * @param {Socket} socket
 * @param {Object} data
 * @param {Function} ackCallback
 * @api private
 */

ChannelController.prototype.handleMessage = function(socket, data, ackCallback) {
  var request = new Request(data),
      response = new Response(null, callbackWrapper),
      action = request.getAction(),
      _this = this;

  // provide internal event hook that fires before public hook
  this.emit('@request:'+action, socket, request, response);

  response.setHeader('idProperty', this.idProperty);
  response.setHeader('status', 200);

  function callbackWrapper(error) {
    if (error) {
      response.setError(500, error.toString());
      _this.emit('@error', error, response);
    }

    if (ackCallback) ackCallback.call(null, response);
    _this.emit('@respond:'+action, socket, request, response);
  }

  // fire public event hook
  this.emit(action, request, response, callbackWrapper);
};
