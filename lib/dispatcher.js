var EventEmitter = require('events').EventEmitter,
    util = require('util');


// TODO : pubsub should be replaceable with Redis or similar.
var pubsub = new EventEmitter();
pubsub.setMaxListeners(0);


module.exports = Dispatcher;

/**
 * A Dispatcher is a pub sub system bound to a single event.
 *
 * @param {String} event
 */

function Dispatcher(event) {
  this.event = event;
}

/**
 * Subscribe to all events published to by this or any
 * related dispatcher.
 */

Dispatcher.prototype.subscribe = function(callback) {
  pubsub.on(this.event, callback);
};

/**
 * Unsubscribe callback.
 */

Dispatcher.prototype.unsubscribe = function(callback) {
  pubsub.removeListener(this.event, callback);
};

/**
 * Publish an event to this and any related dispather.
 *
 * @param {Mixed} arguments
 */

Dispatcher.prototype.publish = function() {
  var args = Array.prototype.slice.call(arguments, 0);

  args.unshift(this.event);
  pubsub.emit.apply(pubsub, args);
};
