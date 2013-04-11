var util = require('./util');


module.exports = Payload;


/**
 * Message wrapper object
 *
 * @param {Object} message
 */

function Payload(message) {
  util.merge(this, message);

  this.headers = this.headers || {};
  this.objects = this.objects || [];
  this.meta = this.meta || {};
}

/**
 * Set message header value
 *
 * @param {String} key
 * @param {String|Number} value
 * @api public
 */

Payload.prototype.setHeader = function(key, value) {
  this.headers[key] = value;
};

/**
 * Set error on message. Use http style error codes.
 *
 * @param {Number} code
 * @param {String} message
 * @api public
 */

Payload.prototype.setError = function(code, message) {
  this.setHeader('status', code);
  this.setHeader('message', message);
};

/**
 * Check if message has an error code
 *
 * @return {Boolean}
 * @api public
 */

Payload.prototype.error = function() {
  return !this.success();
};

/**
 * Check if message is successful
 *
 * @return {Boolean}
 * @api public
 */

Payload.prototype.success = function() {
  return this.headers.status >= 200 && this.headers.status < 300;
};

/**
 * Returns a error code and message pair
 *
 * @return {Array|undefined}
 * @api public
 */

Payload.prototype.getError = function() {
  if (this.error()) {
    return [this.headers.status, this.headers.message];
  }
};

/**
 * Returns the action associated with this message.
 *
 * @return {String}
 * @api public
 */

Payload.prototype.getAction = function() {
  return this.headers.action;
};

/**
 * Returns the request parameters.
 *
 * @return {*}
 * @api public
 */

Payload.prototype.getParams = function() {
  return this.meta.params || {};
};

/**
 * Ensure only message is encoded as JSON.
 *
 * @return {Object}
 * @api public
 */

Payload.prototype.toJSON = function() {
  return {
    headers: this.headers,
    objects: this.objects,
    meta: this.meta
  };
};
