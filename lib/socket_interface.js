
module.exports = SocketInterface;

/**
 * Universal interface for socket.io.Namespace and
 * socket.io.Socket. Will queue calls to .on and .send
 * until socket connection is made.
 *
 * @api private
 */

function SocketInterface() {
  queue(this, 'on');
  queue(this, 'send');
}

/**
 * Realize socket within interface and flush any calls
 * to .on and .send
 *
 * @param {socket.io.Namespace|socket.io.Socket} socket
 * @api private
 */

SocketInterface.prototype.realize = function(socket) {
  this.socket = socket;
  this.on.flush();
  this.send.flush();
};

/**
 * Bind callback to socket event
 *
 * @api public
 */

SocketInterface.prototype.on = function(callback) {
  this.socket.on.apply(this.socket, arguments);
};

/**
 * Send message using socket
 *
 * @api public
 */

SocketInterface.prototype.send = function() {
  this.socket.emit.apply(this.socket, arguments);
};


/**
 * Create a method queue for named method on object.
 * Call object.method.flush() to flush the queue and restore
 * original method.
 *
 * @param {Object} object
 * @param {String} methodName
 * @api private
 */

function queue(object, methodName) {
  var existing = object[methodName];

  function queuedMethod() {
    queuedMethod.queue.push(arguments);
  }

  queuedMethod.queue = [];
  queuedMethod.flush = function() {
    for (var i = queuedMethod.queue.length - 1; i >= 0; i--) {
      existing.apply(object, queuedMethod.queue[i]);
    }
    object[methodName] = existing;
  };

  object[methodName] = queuedMethod;
}
