var util = require('./util'),
    Payload = require('./payload');


module.exports = Response;


/**
 * An outbound response message.
 */

function Response(message, ackCallback) {
  Payload.call(this, message);
  this.headers.status = this.headers.status || 200;
  this.ackCallback = ackCallback;
}

util.merge(Response.prototype, Payload.prototype);


/**
 * Send response to client
 *
 * @param {Array} objects
 * @api public
 */

Response.prototype.send = function(objects) {
  this.objects = objects;
  this.ackCallback();
};
