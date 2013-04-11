var Client = require('./client'),
    Payload = require('../../lib/payload'),
    Feed = require('../../lib/feed').with({
      EventEmitter: require('./event_emitter')
    }),
    Channel;

/**
 * A channel is a bidirectional data exchange for a named resource. 
 * A channel is configured on the client to accept inbound CRUD 
 * requests and to be the transport for outbound CRUD requests. 
 *
 * @api public
 */

module.exports = Channel = Feed.extend();


/**
 * Channel initialization
 */

Channel.on('@initialize', function() {
  var _this = this;

  this.socketInterface.on('connect', function() {
    _this.emit('@connect');
  });

  this.socketInterface.on('disconnect', function() {
    _this.emit('@disconnect');
  });

  this.socketInterface.on(this.resource, function(message) {
    _this.parseMessage(message);
  });

  Client.onReady(function() {
    _this.socketInterface.realize(Client.socket);
  });

  if (this.debug) {
    this.on('*', debug);
  }
});

/**
 * Parse incoming messages.
 *
 * @param {Object} message
 * @api private
 */

Channel.prototype.parseMessage = function(message) {
  if (!message.headers || !message.headers.action) {
    throw "Received an invalid socket message";
  }
  this.emit(message.headers.action, new Payload(message));
};

/**
 * log debug message to console
 *
 * @api private
 */

function debug() {
  if (console && console.log) {
    args = Array.prototype.slice.call(arguments, 0);
    args[0] = "%c" + args[0];
    args.splice(1, 0, 'background-color:#bbb;color:white;padding:2px 6px;border-radius:3px;');
    console.log.apply(console, args);
  }
}
