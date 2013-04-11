var indexOf = require('../../lib/util').indexOf;

module.exports = EventEmitter;

/**
 * Client side event emitter implementation to match the API of
 * node's events.EventEmitter.
 *
 * @api private
 */

function EventEmitter() {
  this._handlers = {};
}

/**
 * Add event listener.
 *
 * @param {String} event
 * @param {Function} callback
 * @api public
 */

EventEmitter.prototype.addListener = function(event, callback) {
  this._handlers[event] = this._handlers[event] || [];
  this._handlers[event].push(callback);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;

/**
 * Add event listener and fire only once.
 *
 * @param {String} event
 * @param {Function} callback
 * @api public
 */

EventEmitter.prototype.once = function(event, callback) {
  var _this = this;

  function wrapper() {
    callback.apply(null, arguments);
    _this.removeListener(event, wrapper);
  }
  callback._wrappedBy = wrapper;

  this.addListener(event, wrapper);
};

/**
 * Remove an event listener.
 *
 * @param {String} event
 * @param {Function} callback
 * @api public
 */

EventEmitter.prototype.removeListener = function(event, callback) {
  var handlers = this.listeners(event),
      index = indexOf(handlers, callback._wrappedBy || callback);

  if (~index) {
    handlers.splice(index, 1);
  }
};

/**
 * Remove all listeners for an event.
 *
 * @param {String} event
 * @api public
 */

EventEmitter.prototype.removeAllListeners = function(event) {
  if (event) {
    this._handlers[event] = [];
  } else {
    this._handlers = {};
  }
};

/**
 * Get all listeners for an event.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

EventEmitter.prototype.listeners = function(event) {
  return this._handlers[event] || [];
};

/**
 * Emit an event. Will pass any additional arguments to event
 * listers.
 *
 * @param {String} event
 * @param {*} arguments to pass to listeners
 * @api public
 */

EventEmitter.prototype.emit = function(event) {
  var handlers = this.listeners(event),
      args = Array.prototype.slice.call(arguments, 1);

  for (var i = handlers.length - 1; i >= 0; i--) {
    handlers[i].apply(null, args);
  }
};



